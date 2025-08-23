import React, { useState } from "react";
import { Link } from "@shared/schema";
import LinkItem from "./link-item";
import AddLinkDialog from "./add-link-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

type LinksManagerProps = {
  links: Link[];
  onAddClick: () => void;
};

const LinksManager: React.FC<LinksManagerProps> = ({ links, onAddClick }) => {
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setShowEditDialog(true);
  };
  
  const safeLinks = links || [];

  return (
    <>
      <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-200">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading text-xl font-semibold text-base-content">Your Links</h2>
          <Button
            onClick={onAddClick}
            className="gap-1"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add New Link</span>
          </Button>
        </div>
        
        {/* Links List */}
        <div className="space-y-3">
          {safeLinks.length === 0 ? (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/50">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-base-content mb-1">No links yet</h3>
              <p className="text-base-content/60 mb-4">Add your first link to get started</p>
              <Button 
                onClick={onAddClick}
                variant="secondary"
                className="gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Your First Link</span>
              </Button>
            </div>
          ) : (
            safeLinks.map(link => (
              <LinkItem 
                key={link.id} 
                link={link} 
                onEdit={handleEditLink}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Edit Link Dialog */}
      {editingLink && (
        <AddLinkDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          existingLink={editingLink}
        />
      )}
    </>
  );
};

export default LinksManager;
