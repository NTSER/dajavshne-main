import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  UserPlus, 
  Users, 
  Mail, 
  Check, 
  X, 
  Trash2, 
  Clock,
  Send
} from "lucide-react";
import { 
  useFriends, 
  useFriendRequests, 
  useSendFriendRequest, 
  useRespondToFriendRequest, 
  useRemoveFriend 
} from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

const FriendsManagement = () => {
  const [friendEmail, setFriendEmail] = useState("");
  const { user } = useAuth();
  
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { data: friendRequests = [], isLoading: requestsLoading } = useFriendRequests();
  const sendRequest = useSendFriendRequest();
  const respondToRequest = useRespondToFriendRequest();
  const removeFriend = useRemoveFriend();

  const pendingRequests = friendRequests.filter(req => 
    req.receiver_id === user?.id && req.status === 'pending'
  );
  const sentRequests = friendRequests.filter(req => 
    req.sender_id === user?.id && req.status === 'pending'
  );

  const handleSendRequest = async () => {
    if (!friendEmail.trim()) return;
    
    try {
      await sendRequest.mutateAsync(friendEmail);
      setFriendEmail("");
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleRespondToRequest = (requestId: string, status: 'accepted' | 'declined') => {
    respondToRequest.mutate({ requestId, status });
  };

  const handleRemoveFriend = (friendshipId: string) => {
    if (confirm("Are you sure you want to remove this friend?")) {
      removeFriend.mutate(friendshipId);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends Management
          </CardTitle>
          <CardDescription>
            Manage your friends, send requests, and create gaming lobbies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Requests ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="add-friend" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Friend
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Friends</h3>
                <Badge variant="secondary">{friends.length} friends</Badge>
              </div>
              
              <ScrollArea className="h-[400px] w-full">
                {friendsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border animate-pulse">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-muted rounded w-1/3" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No friends yet. Start by adding some friends!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={friend.friend_profile?.avatar_url} />
                            <AvatarFallback>
                              {getInitials(friend.friend_profile?.full_name || 'Unknown')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {friend.friend_profile?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {friend.friend_profile?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Friends since {formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="space-y-4">
                {/* Incoming Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Incoming Requests</h3>
                  {pendingRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No pending friend requests</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={request.sender_profile?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(request.sender_profile?.full_name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {request.sender_profile?.full_name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.sender_profile?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondToRequest(request.id, 'accepted')}
                              disabled={respondToRequest.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespondToRequest(request.id, 'declined')}
                              disabled={respondToRequest.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Sent Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sent Requests</h3>
                  {sentRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No pending sent requests</p>
                  ) : (
                    <div className="space-y-3">
                      {sentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={request.receiver_profile?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(request.receiver_profile?.full_name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {request.receiver_profile?.full_name || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.receiver_profile?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Sent {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="add-friend" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Add New Friend</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="friend-email" className="text-sm font-medium">
                          Friend's Email Address
                        </label>
                        <Input
                          id="friend-email"
                          type="email"
                          placeholder="Enter friend's email address"
                          value={friendEmail}
                          onChange={(e) => setFriendEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendRequest()}
                        />
                      </div>
                      <Button 
                        onClick={handleSendRequest}
                        disabled={!friendEmail.trim() || sendRequest.isPending}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendRequest.isPending ? 'Sending...' : 'Send Friend Request'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriendsManagement;