
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { AddUserDialog, UserFormValues } from "@/components/users/add-user-dialog";
import { formatToPHP } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import useMockAuth, { StoredUser, setUsers as setGlobalUsers } from "@/hooks/use-mock-auth";


const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    Administrator: "default",
    Cashier: "secondary",
    Staff: "outline"
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
}

export default function UsersPage() {
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const { users } = useMockAuth();
  const { toast } = useToast();

  const handleToggleStatus = (userId: string) => {
    const newUsers = users.map(user => {
      if (user.id === userId) {
        if (user.role === 'Administrator') {
          toast({
            variant: "destructive",
            title: "Action Not Allowed",
            description: "The Administrator account cannot be deactivated.",
          });
          return user;
        }
        const newStatus: 'Active' | 'Inactive' = user.status === 'Active' ? 'Inactive' : 'Active';
        toast({
          title: "User Status Updated",
          description: `${user.name}'s status has been set to ${newStatus}.`,
        });
        return { ...user, status: newStatus };
      }
      return user;
    });
    setGlobalUsers(newUsers);
  };
  
  const handleUserAdded = (newUserData: UserFormValues) => {
    const newUser: StoredUser = {
      ...newUserData,
      id: `user_${new Date().getTime()}`,
      avatarUrl: newUserData.avatar ? URL.createObjectURL(newUserData.avatar) : `https://picsum.photos/seed/${newUserData.name}/100/100`,
      status: 'Active' as const,
    };
    setGlobalUsers([newUser, ...users]);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <Button onClick={() => setAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>
              Manage employee accounts and their roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Hourly Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className={user.status === 'Inactive' ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                           <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground sm:hidden">{user.email}</div>
                           </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {formatToPHP(user.hourlyRate)}
                    </TableCell>
                    <TableCell>
                        <Badge variant={user.status === 'Active' ? 'secondary' : 'outline'}>
                            {user.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                            {user.status === 'Active' ? 'Set as Inactive' : 'Set as Active'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AddUserDialog isOpen={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen} onUserAdded={handleUserAdded}/>
    </>
  );
}
