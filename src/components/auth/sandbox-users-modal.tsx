import { User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
export function SandboxUsersModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-4 left-4 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          <span>Sandbox Dev Mode</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sandbox Users
          </DialogTitle>
          <DialogDescription>
            For school/grading purposes, here are all existing accounts
            currently in the development database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="text-center p-4 text-muted-foreground">
            <p>PocketBase now owns auth accounts.</p>
            <p className="text-sm">
              Use the PocketBase admin UI for sandbox account inspection.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
