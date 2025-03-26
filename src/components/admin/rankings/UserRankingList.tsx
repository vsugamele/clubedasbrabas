
import { useState, useEffect } from "react";
import { fetchTopRankings } from "./rankingService";
import { UserRanking } from "../communities/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Trophy, Award, Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileType } from "@/context/auth/types";

export const UserRankingList = () => {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, ProfileType>>({});
  
  useEffect(() => {
    loadRankings();
  }, []);
  
  const loadRankings = async () => {
    setLoading(true);
    const data = await fetchTopRankings();
    setRankings(data);
    
    // Fetch user profiles
    if (data.length > 0) {
      await loadUserProfiles(data.map(ranking => ranking.userId));
    }
    
    setLoading(false);
  };
  
  const loadUserProfiles = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const profileMap: Record<string, ProfileType> = {};
        data.forEach(profileData => {
          // Convert database profile to ProfileType with default values
          const profileWithDefaults: ProfileType = {
            id: profileData.id,
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || '',
            bio: profileData.bio || null,
            username: profileData.username || '',
            headline: profileData.headline || null,
            location: profileData.location || null,
            language: profileData.language || null,
            timezone: profileData.timezone || null,
            updated_at: profileData.updated_at || new Date().toISOString(),
            // Default values for fields not in the database
            created_at: new Date().toISOString(),
            email: null,
            is_public: true
          };
          profileMap[profileData.id] = profileWithDefaults;
        });
        setProfiles(profileMap);
      }
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  };
  
  const getLevelIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Trophy className="h-5 w-5 text-amber-700" />;
      default:
        return <Award className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getAvatarFallback = (userId: string) => {
    const profile = profiles[userId];
    if (profile && profile.full_name) {
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return 'US';
  };
  
  const getUserName = (userId: string) => {
    const profile = profiles[userId];
    if (profile) {
      return profile.full_name || profile.username || 'Anônimo';
    }
    return 'Usuário';
  };
  
  return (
    <Card className="border-[#ff920e]/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#ff4400]" />
          <span>Ranking de Usuários</span>
        </CardTitle>
        <CardDescription>
          Os usuários mais ativos da plataforma
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff4400]"></div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            Sem dados de ranking disponíveis ainda
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((ranking, index) => (
              <div 
                key={ranking.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/40 border border-[#ff920e]/10"
              >
                <div className="flex-shrink-0 w-8 text-center font-bold text-lg text-[#ff4400]">
                  #{index + 1}
                </div>
                
                <Avatar className="h-10 w-10 border-2 border-[#ff920e]/20">
                  <AvatarFallback className="bg-[#ff4400]/10 text-[#ff4400]">
                    {getAvatarFallback(ranking.userId)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="font-medium">{getUserName(ranking.userId)}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3" />
                    <span>Nível {ranking.level}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {getLevelIcon(index)}
                  <div className="text-sm font-semibold">{ranking.points} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRankingList;
