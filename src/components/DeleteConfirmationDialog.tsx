import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

type DeleteConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationType: 'private' | 'chatroom';
  name: string;
  isAdmin: boolean;
  onDeleteForMe: () => void;
  onDeleteForAll: () => void;
  onCancel: () => void;
};

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  conversationType,
  name,
  isAdmin,
  onDeleteForMe,
  onDeleteForAll,
  onCancel
}) => {
  // Generate the confirmation message based on conversation type and user role
  const getConfirmationMessage = () => {
    if (conversationType === 'private') {
      return `Permanently delete the chat with "${name}"?`;
    } else if (conversationType === 'chatroom' && isAdmin) {
      return `Permanently leave and delete "${name}"?`;
    } else {
      return `Leave "${name}"?`;
    }
  };

  // Get the button text for "delete for me" option
  const getDeleteForMeText = () => {
    if (conversationType === 'private') {
      return 'Delete just for me';
    } else if (conversationType === 'chatroom') {
      return 'Delete for me';
    }
  };

  // Get the button text for "delete for all" option
  const getDeleteForAllText = () => {
    if (conversationType === 'private') {
      return `Delete for me and ${name}`;
    } else if (conversationType === 'chatroom' && isAdmin) {
      return 'Delete for all members';
    } else {
      return 'Delete group';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="flex flex-col items-center text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
          <DialogTitle className="text-red-500">Delete Confirmation</DialogTitle>
        </DialogHeader>
        
        <div className="my-4 text-center">
          <p className="font-medium mb-4">{getConfirmationMessage()}</p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            variant="destructive"
            onClick={onDeleteForMe}
            className="w-full"
          >
            {getDeleteForMeText()}
          </Button>
          
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            onClick={onDeleteForAll}
          >
            {getDeleteForAllText()}
          </Button>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog; 