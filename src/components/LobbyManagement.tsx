import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Plus, 
  Crown, 
  UserMinus, 
  Trash2, 
  Check, 
  X, 
  Clock,
  Send,
  MapPin
} from "lucide-react";
import { 
  useLobbies, 
  useLobbyDetails, 
  useCreateLobby, 
  useInviteToLobby, 
  useRespondToLobbyInvitation, 
  useRemoveFromLobby, 
  useDeleteLobby,
  useActiveLobby 
} from "@/hooks/useLobbies";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "react-router-dom";

interface LobbyManagementProps {
  venueId?: string;
}

const LobbyManagement = ({ venueId }: LobbyManagementProps) => {
  const [lobbyName, setLobbyName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null);
  const { user } = useAuth();
  
  const { data: lobbies = [], isLoading: lobbiesLoading } = useLobbies();
  const { data: friends = [] } = useFriends();
  const { data: activeLobby } = useActiveLobby();
  const { data: selectedLobby } = useLobbyDetails(selectedLobbyId || '');
  
  const createLobby = useCreateLobby();
  const inviteToLobby = useInviteToLobby();
  const respondToInvitation = useRespondToLobbyInvitation();
  const removeFromLobby = useRemoveFromLobby();
  const deleteLobby = useDeleteLobby();

  // Get lobbies where user is invited but hasn't responded
  const invitations = lobbies.filter(lobby => {
    if (!selectedLobby?.members || lobby.creator_id === user?.id) return false;
    const userMember = selectedLobby.members.find(m => m.user_id === user?.id);
    return userMember?.status === 'invited';
  });

  const handleCreateLobby = async () => {
    if (!lobbyName.trim()) return;
    
    try {
      const lobby = await createLobby.mutateAsync({ 
        name: lobbyName,
        venueId 
      });
      setLobbyName("");
      setSelectedLobbyId(lobby.id);
      
      // Automatically invite selected friends
      if (selectedFriends.length > 0) {
        await inviteToLobby.mutateAsync({
          lobbyId: lobby.id,
          friendIds: selectedFriends
        });
        setSelectedFriends([]);
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleInviteFriends = () => {
    if (!selectedLobbyId || selectedFriends.length === 0) return;
    
    inviteToLobby.mutate({
      lobbyId: selectedLobbyId,
      friendIds: selectedFriends
    });
    setSelectedFriends([]);
  };

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleRespondToInvitation = (lobbyId: string, status: 'accepted' | 'declined') => {
    respondToInvitation.mutate({ lobbyId, status });
  };

  const handleRemoveMember = (lobbyId: string, userId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeFromLobby.mutate({ lobbyId, userId });
    }
  };

  const handleDeleteLobby = (lobbyId: string) => {
    if (confirm("Are you sure you want to delete this lobby? This action cannot be undone.")) {
      deleteLobby.mutate(lobbyId);
      if (selectedLobbyId === lobbyId) {
        setSelectedLobbyId(null);
      }
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

  const getAcceptedMembersCount = (lobby: any) => {
    if (!selectedLobby?.members) return 0;
    return selectedLobby.members.filter(m => m.status === 'accepted').length + 1; // +1 for creator
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gaming Lobbies
          </CardTitle>
          <CardDescription>
            Create lobbies, invite friends, and coordinate your gaming sessions
            {venueId && (
              <span className="flex items-center gap-1 mt-1 text-primary">
                <MapPin className="h-3 w-3" />
                Creating lobby for this venue
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="my-lobbies" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-lobbies">
                My Lobbies ({lobbies.filter(l => l.creator_id === user?.id).length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations ({invitations.length})
              </TabsTrigger>
              <TabsTrigger value="create-lobby">
                Create Lobby
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-lobbies" className="space-y-4">
              {/* Active Lobby Status */}
              {activeLobby && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-primary">Active Lobby</h3>
                        <p className="text-sm text-muted-foreground">{activeLobby.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getAcceptedMembersCount(activeLobby)} members ready
                        </p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <ScrollArea className="h-[400px] w-full">
                {lobbiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 rounded-lg border animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : lobbies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No lobbies yet. Create your first lobby!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lobbies.map((lobby) => (
                      <Card key={lobby.id} className={`cursor-pointer transition-colors ${
                        selectedLobbyId === lobby.id ? 'ring-2 ring-primary' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1" onClick={() => setSelectedLobbyId(lobby.id)}>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{lobby.name}</h3>
                                {lobby.creator_id === user?.id && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {lobby.member_count} members • Created {formatDistanceToNow(new Date(lobby.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {lobby.creator_id === user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLobby(lobby.id);
                                }}
                                className="text-destructive hover:text-destructive ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Lobby Details */}
              {selectedLobby && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedLobby.name}</span>
                      {selectedLobby.creator_id === user?.id && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLobbyId(null)}
                          >
                            Invite Friends
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium">Members ({(selectedLobby.members?.length || 0) + 1})</h4>
                      
                      {/* Creator */}
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(user?.user_metadata?.full_name || 'You')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2">
                            You (Creator)
                            <Crown className="h-4 w-4 text-yellow-500" />
                          </p>
                        </div>
                        <Badge variant="default">Creator</Badge>
                      </div>

                      {/* Members */}
                      {selectedLobby.members?.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.profile?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(member.profile?.full_name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profile?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.status === 'invited' ? 'Invited' : 
                                 member.status === 'accepted' ? 'Joined' : 'Declined'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              member.status === 'accepted' ? 'default' :
                              member.status === 'invited' ? 'secondary' : 'destructive'
                            }>
                              {member.status}
                            </Badge>
                            {selectedLobby.creator_id === user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(selectedLobby.id, member.user_id)}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4">
              <ScrollArea className="h-[400px] w-full">
                {invitations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending invitations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((lobby) => (
                      <Card key={lobby.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{lobby.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Invited {formatDistanceToNow(new Date(lobby.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRespondToInvitation(lobby.id, 'accepted')}
                                disabled={respondToInvitation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRespondToInvitation(lobby.id, 'declined')}
                                disabled={respondToInvitation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create-lobby" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Lobby</CardTitle>
                  <CardDescription>
                    Create a lobby and invite friends to join your gaming session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lobby Name</label>
                    <Input
                      placeholder="Enter lobby name"
                      value={lobbyName}
                      onChange={(e) => setLobbyName(e.target.value)}
                    />
                  </div>

                  {friends.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Invite Friends (Optional)</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {friends.map((friend) => (
                          <div key={friend.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={friend.id}
                              checked={selectedFriends.includes(friend.friend_profile?.id || '')}
                              onCheckedChange={() => handleToggleFriend(friend.friend_profile?.id || '')}
                            />
                            <label htmlFor={friend.id} className="flex items-center space-x-2 cursor-pointer">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={friend.friend_profile?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(friend.friend_profile?.full_name || 'Unknown')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{friend.friend_profile?.full_name}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleCreateLobby}
                    disabled={!lobbyName.trim() || createLobby.isPending}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createLobby.isPending ? 'Creating...' : 'Create Lobby'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LobbyManagement;