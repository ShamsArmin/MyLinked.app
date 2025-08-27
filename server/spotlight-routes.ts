import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";
import {
  createSpotlightProjectSchema,
  contributorSchema,
  tagSchema,
  spotlightProjects,
  spotlightContributors,
  spotlightTags,
} from "../shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";

export const spotlightRouter = Router();

async function ensureSpotlightTables() {
  try {
    await db.select().from(spotlightProjects).limit(1);
    await db.select().from(spotlightContributors).limit(1);
    await db.select().from(spotlightTags).limit(1);
  } catch (err: any) {
    if (err?.code === "42P01") {
      // Create spotlight tables if they are missing. We avoid running the
      // full migration set because existing databases may already contain
      // earlier tables and lack the drizzle migrations metadata, which would
      // cause "relation already exists" errors when re-running migrations.
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS spotlight_projects (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(100) NOT NULL,
          url VARCHAR(1000) NOT NULL,
          description TEXT,
          thumbnail TEXT,
          is_pinned BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          view_count INTEGER DEFAULT 0,
          click_count INTEGER DEFAULT 0
        );`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS spotlight_contributors (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES spotlight_projects(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id),
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          role VARCHAR(50),
          is_registered_user BOOLEAN DEFAULT FALSE,
          added_at TIMESTAMP DEFAULT NOW()
        );`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS spotlight_tags (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES spotlight_projects(id) ON DELETE CASCADE,
          label VARCHAR(50) NOT NULL,
          icon VARCHAR(50),
          type VARCHAR(20) DEFAULT 'tag'
        );`);
    } else {
      throw err;
    }
  }
}

// Middleware to check authentication
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Middleware to check if user is project owner
async function isProjectOwner(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const projectId = parseInt(req.params.projectId);
  const userId = req.user!.id;
  
  try {
    const project = await storage.getSpotlightProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if (project.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to modify this project" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking project ownership:", error);
    res.status(500).json({ message: "Error checking project ownership" });
  }
}

// Get all spotlight projects for current user
spotlightRouter.get("/projects", isAuthenticated, async (req, res) => {
  try {
    await ensureSpotlightTables();
    const userId = req.user!.id;
    const projects = await storage.getSpotlightProjects(userId);
    
    // Enrich with contributors and tags
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const contributors = await storage.getProjectContributors(project.id);
        const tags = await storage.getProjectTags(project.id);
        
        return {
          ...project,
          contributors,
          tags,
        };
      })
    );
    
    res.json(projectsWithDetails);
  } catch (error) {
    console.error("Error fetching spotlight projects:", error);
    res.status(500).json({ message: "Error fetching spotlight projects" });
  }
});

// Get a specific spotlight project
spotlightRouter.get("/projects/:projectId", async (req, res) => {
  try {
    await ensureSpotlightTables();
    const projectId = parseInt(req.params.projectId);
    const project = await storage.getSpotlightProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Increment view count
    await storage.incrementProjectViews(projectId);
    
    // Get contributors and tags
    const contributors = await storage.getProjectContributors(projectId);
    const tags = await storage.getProjectTags(projectId);
    
    res.json({
      ...project,
      contributors,
      tags,
    });
  } catch (error) {
    console.error("Error fetching spotlight project:", error);
    res.status(500).json({ message: "Error fetching spotlight project" });
  }
});

// Create a new spotlight project
spotlightRouter.post("/projects", isAuthenticated, async (req, res) => {
  try {
    await ensureSpotlightTables();
    const userId = req.user!.id;
    
    // Modified schema with relaxed validation for the thumbnail and email
    const createSchema = createSpotlightProjectSchema.extend({
      thumbnail: z.string().optional(),
      contributors: z.array(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().optional().or(z.literal("")),
          role: z.string().optional().or(z.literal("")),
        })
      ).optional(),
    });
    
    // Try to parse, but handle email validation errors gracefully
    let projectData;
    try {
      projectData = createSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle email validation errors by cleaning the input
        if (req.body.contributors) {
          req.body.contributors = req.body.contributors.map((c: any) => ({
            ...c,
            email: c.email && c.email.includes('@') ? c.email : '',
            role: c.role || ''
          }));
        }
        // Try parsing again
        projectData = createSchema.parse(req.body);
      } else {
        throw error;
      }
    }
    
    // Extract contributors and tags before creating the project
    const { contributors = [], tags = [], ...projectDetails } = projectData;
    
    // Create project with basic details first
    console.log("Creating project with details:", projectDetails);
    const newProject = await storage.createSpotlightProject({
      ...projectDetails
    }, userId);
    
    // Add contributors
    if (contributors.length > 0) {
      console.log("Adding contributors:", contributors);
      try {
        await Promise.all(
          contributors.map(contributor => 
            storage.addContributor(newProject.id, contributor)
          )
        );
        console.log("Contributors added successfully");
      } catch (err) {
        console.error("Error adding contributors:", err);
      }
    }
    
    // Add tags (maximum 3)
    if (tags.length > 0) {
      console.log("Adding tags:", tags);
      const tagsToAdd = tags.slice(0, 3);
      try {
        await Promise.all(
          tagsToAdd.map(tag => 
            storage.addTag(newProject.id, tag)
          )
        );
        console.log("Tags added successfully");
      } catch (err) {
        console.error("Error adding tags:", err);
      }
    }
    
    // Get complete project with contributors and tags
    const createdContributors = await storage.getProjectContributors(newProject.id);
    const createdTags = await storage.getProjectTags(newProject.id);
    
    res.status(201).json({
      ...newProject,
      contributors: createdContributors,
      tags: createdTags,
    });
  } catch (error) {
    console.error("Error creating spotlight project:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid project data", errors: error.errors });
    }
    res.status(500).json({ message: "Error creating spotlight project" });
  }
});

// Update a spotlight project
spotlightRouter.patch("/projects/:projectId", isProjectOwner, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    // Modified schema with relaxed validation for the thumbnail
    const updateSchema = createSpotlightProjectSchema.partial().extend({
      thumbnail: z.string().optional(),
    });
    const updates = updateSchema.parse(req.body);
    
    // Extract contributors and tags
    const { contributors, tags, ...projectUpdates } = updates;
    
    // Update project details
    const updatedProject = await storage.updateSpotlightProject(projectId, projectUpdates);
    
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Handle contributor updates if provided
    if (contributors) {
      console.log("Updating contributors for project:", projectId, contributors);
      try {
        // Remove existing contributors
        const existingContributors = await storage.getProjectContributors(projectId);
        console.log("Existing contributors:", existingContributors);
        
        // Remove all existing contributors
        for (const contributor of existingContributors) {
          await storage.removeContributor(contributor.id);
        }
        
        // Add new contributors one by one to ensure they're added correctly
        for (const contributor of contributors) {
          if (contributor.name?.trim()) {
            await storage.addContributor(projectId, {
              name: contributor.name,
              email: contributor.email || "",
              role: contributor.role || ""
            });
          }
        }
        console.log("Contributors updated successfully");
      } catch (err) {
        console.error("Error updating contributors:", err);
      }
    }
    
    // Handle tag updates if provided
    if (tags) {
      console.log("Updating tags for project:", projectId, tags);
      try {
        // Remove existing tags
        const existingTags = await storage.getProjectTags(projectId);
        console.log("Existing tags:", existingTags);
        
        // Remove all existing tags
        for (const tag of existingTags) {
          await storage.removeTag(tag.id);
        }
        
        // Add new tags (maximum 3) one by one to ensure they're added correctly
        const tagsToAdd = tags.slice(0, 3);
        for (const tag of tagsToAdd) {
          if (tag.label?.trim()) {
            await storage.addTag(projectId, {
              label: tag.label,
              type: tag.type || "tag"
            });
          }
        }
        console.log("Tags updated successfully");
      } catch (err) {
        console.error("Error updating tags:", err);
      }
    }
    
    // Get the updated project with contributors and tags
    const updatedContributors = await storage.getProjectContributors(projectId);
    const updatedTags = await storage.getProjectTags(projectId);
    
    res.json({
      ...updatedProject,
      contributors: updatedContributors,
      tags: updatedTags,
    });
  } catch (error) {
    console.error("Error updating spotlight project:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid update data", errors: error.errors });
    }
    res.status(500).json({ message: "Error updating spotlight project" });
  }
});

// Delete a spotlight project
spotlightRouter.delete("/projects/:projectId", isProjectOwner, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const success = await storage.deleteSpotlightProject(projectId);
    
    if (!success) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting spotlight project:", error);
    res.status(500).json({ message: "Error deleting spotlight project" });
  }
});

// Toggle pin status of a project
spotlightRouter.post("/projects/:projectId/pin", isProjectOwner, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { isPinned } = req.body;
    
    if (typeof isPinned !== 'boolean') {
      return res.status(400).json({ message: "isPinned field is required and must be a boolean" });
    }
    
    const updatedProject = await storage.setPinnedStatus(projectId, isPinned);
    
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Get the complete project details
    const contributors = await storage.getProjectContributors(projectId);
    const tags = await storage.getProjectTags(projectId);
    
    res.json({
      ...updatedProject,
      contributors,
      tags,
    });
  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({ message: "Error toggling pin status" });
  }
});

// Record a click on the project link
spotlightRouter.post("/projects/:projectId/click", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    await storage.incrementProjectClicks(projectId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error recording project click:", error);
    res.status(500).json({ message: "Error recording project click" });
  }
});

// Add a contributor to a project
spotlightRouter.post("/projects/:projectId/contributors", isProjectOwner, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const contributorData = contributorSchema.omit({ projectId: true }).parse(req.body);
    
    const newContributor = await storage.addContributor(projectId, contributorData);
    
    res.status(201).json(newContributor);
  } catch (error) {
    console.error("Error adding contributor:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid contributor data", errors: error.errors });
    }
    res.status(500).json({ message: "Error adding contributor" });
  }
});

// Remove a contributor from a project
spotlightRouter.delete("/contributors/:contributorId", isAuthenticated, async (req, res) => {
  try {
    const contributorId = parseInt(req.params.contributorId);
    
    // First check if the user owns the project this contributor belongs to
    const userId = req.user!.id;
    const contributors = await storage.getProjectContributors(parseInt(req.params.projectId));
    const contributor = contributors.find(c => c.id === contributorId);
    
    if (!contributor) {
      return res.status(404).json({ message: "Contributor not found" });
    }
    
    const project = await storage.getSpotlightProjectById(contributor.projectId);
    
    if (!project || project.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to remove this contributor" });
    }
    
    const success = await storage.removeContributor(contributorId);
    
    if (!success) {
      return res.status(404).json({ message: "Contributor not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error removing contributor:", error);
    res.status(500).json({ message: "Error removing contributor" });
  }
});

// Add a tag to a project
spotlightRouter.post("/projects/:projectId/tags", isProjectOwner, async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    // Check if project already has 3 tags
    const existingTags = await storage.getProjectTags(projectId);
    if (existingTags.length >= 3) {
      return res.status(400).json({ message: "Maximum of 3 tags per project" });
    }
    
    const tagData = tagSchema.omit({ projectId: true }).parse(req.body);
    
    const newTag = await storage.addTag(projectId, tagData);
    
    res.status(201).json(newTag);
  } catch (error) {
    console.error("Error adding tag:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid tag data", errors: error.errors });
    }
    res.status(500).json({ message: "Error adding tag" });
  }
});

// Remove a tag from a project
spotlightRouter.delete("/tags/:tagId", isAuthenticated, async (req, res) => {
  try {
    const tagId = parseInt(req.params.tagId);
    const userId = req.user!.id;
    
    // First check if the user owns the project this tag belongs to
    const tags = await storage.getProjectTags(parseInt(req.params.projectId));
    const tag = tags.find(t => t.id === tagId);
    
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }
    
    const project = await storage.getSpotlightProjectById(tag.projectId);
    
    if (!project || project.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to remove this tag" });
    }
    
    const success = await storage.removeTag(tagId);
    
    if (!success) {
      return res.status(404).json({ message: "Tag not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error removing tag:", error);
    res.status(500).json({ message: "Error removing tag" });
  }
});