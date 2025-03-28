import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { votePoll } from "@/services/postService";

interface PostMediaItem {
  type: "image" | "video" | "gif";
  url: string;
  aspectRatio?: number;
  isBase64?: boolean;
}

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  question: string;
  options: string[];
  votes?: Record<string, number>;
  expiresAt?: Date;
  userVoted?: string;
}

interface PostContentProps {
  content: string;
  media?: PostMediaItem[];
  poll?: Poll;
  postId: string;
  onPollVoted?: () => void;
}

export const PostContent = ({ content, media, poll, postId, onPollVoted }: PostContentProps) => {
  const [userVote, setUserVote] = useState<string | null>(poll?.userVoted || null);
  const [isVoting, setIsVoting] = useState(false);
  
  const handleVote = async (optionIndex: number) => {
    if (isVoting || userVote !== null) return;
    
    setIsVoting(true);
    const success = await votePoll(postId, optionIndex);
    
    if (success) {
      setUserVote(poll?.options[optionIndex] || null);
      if (onPollVoted) {
        onPollVoted();
      }
    }
    
    setIsVoting(false);
  };
  
  // Calculate total votes
  const totalVotes = poll?.votes 
    ? Object.values(poll.votes).reduce((sum, count) => sum + count, 0)
    : 0;
  
  return (
    <div className="p-4 pt-0">
      <p className="whitespace-pre-line mb-4">{content}</p>
      
      {poll && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <h4 className="text-lg font-medium mb-3">{poll.question}</h4>
            <div className="space-y-2">
              {poll.options.map((option, index) => {
                const voteCount = poll.votes?.[option] || 0;
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Button
                        variant={userVote === option ? "default" : "outline"}
                        className="w-full text-left justify-start h-auto py-2 font-normal"
                        onClick={() => handleVote(index)}
                        disabled={isVoting || userVote !== null}
                      >
                        {option}
                      </Button>
                      {userVote !== null && (
                        <span className="ml-2 text-sm">{percentage}%</span>
                      )}
                    </div>
                    
                    {userVote !== null && (
                      <Progress value={percentage} className="h-2" />
                    )}
                  </div>
                );
              })}
            </div>
            
            {userVote !== null && (
              <p className="text-sm text-muted-foreground mt-3">
                {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      
      {media && media.length > 0 && (
        <div className={`grid ${media.length > 1 ? "grid-cols-2 gap-2" : "grid-cols-1"} mb-4`}>
          {media.map((item, index) => (
            <div 
              key={index} 
              className={`rounded-lg overflow-hidden ${media.length > 1 ? "" : "w-full"}`}
              style={item.aspectRatio ? { aspectRatio: `${item.aspectRatio}` } : {}}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt="Media content"
                  className="w-full h-full object-cover transition-transform hover:scale-[1.02] cursor-zoom-in"
                  loading="lazy"
                  style={item.url.length > 1000 ? { maxHeight: '400px' } : {}}
                />
              ) : item.type === "video" ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  controls
                  style={item.url.length > 1000 ? { maxHeight: '400px' } : {}}
                />
              ) : (
                <img
                  src={item.url}
                  alt="GIF content"
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
