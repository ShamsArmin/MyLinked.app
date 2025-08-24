import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import { useLocation } from "wouter";

export function SpotlightCard() {
  const [, navigate] = useLocation();
  
  return (
    <div className="text-center py-4">
      <GitBranch className="h-10 w-10 text-muted mx-auto mb-2" />
      <h4 className="text-sm font-medium mb-1">Collaborative Projects</h4>
      <p className="text-xs text-base-content/70 mb-4">Showcase your work with others</p>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs"
        onClick={() => navigate("/spotlight")}
      >
        View Projects
      </Button>
    </div>
  );
}

export default SpotlightCard;