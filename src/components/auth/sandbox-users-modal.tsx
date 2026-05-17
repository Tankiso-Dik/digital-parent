import { useQuery } from "convex/react";
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
import { api } from "../../../convex/_generated/api";

export function SandboxUsersModal() {
  const users = useQuery(api.auth.listSandboxUsers);

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
            This application uses hashed passwords for security. For
            school/grading purposes, here are all existing accounts currently in
            the development database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {users === undefined ? (
            <div className="flex justify-center p-4">
              <span className="text-muted-foreground animate-pulse">
                Loading users...
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <p>No sandbox users found.</p>
              <p className="text-sm">Create an account first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="p-3 bg-muted/30 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">
                      {user.id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
