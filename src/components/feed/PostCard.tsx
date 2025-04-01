import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CommentSection from "./CommentSection";
import { PostHeader } from "./post/PostHeader";
import { PostContent } from "./post/PostContent";
import { PostActions } from "./post/PostActions";
import { HiddenPostView } from "./post/HiddenPostView";
import { Badge } from "@/components/ui/badge";
import { Pin } from "lucide-react";
import { PostData } from "@/services/postService";

export interface PostProps {
  post?: PostData;
  onPostUpdated?: () => void;
  id?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  community?: {
    id: string;
    name: string;
  };
  createdAt?: Date;
  content?: string;
  media?: {
    type: "image" | "video" | "gif";
    url: string;
    aspectRatio?: number;
  }[];
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, number>;
    expiresAt?: Date;
    userVoted?: string;
  };
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  communityId?: string | null;
  isModerator?: boolean;
  onDeletePost?: (postId: string) => void;
  onPinPost?: (postId: string, isPinned: boolean) => void;
}

const PostCard = ({
  post,
  onPostUpdated,
  id,
  author,
  category,
  community,
  createdAt,
  content,
  media,
  poll,
  likes,
  comments,
  isLiked = false,
  isBookmarked = false,
  isPinned = false,
  communityId = null,
  isModerator = false,
  onDeletePost,
  onPinPost,
}: PostProps) => {
  // Use post properties if direct props are not provided
  const postId = id || post?.id;
  const postAuthor = author || post?.author;
  const postCategory = category || post?.category;
  const postCommunity = community || post?.community;
  const postCreatedAt = createdAt || post?.createdAt;
  const postContent = content || post?.content;
  const postMedia = media || post?.media;
  const postPoll = poll || post?.poll;
  const postLikes = likes !== undefined ? likes : post?.likes;
  const postComments = comments !== undefined ? comments : post?.comments;
  const postIsPinned = isPinned !== undefined ? isPinned : post?.isPinned;
  const postCommunityId = communityId !== undefined ? communityId : post?.communityId;

  // Validate required props to prevent errors
  if (!postId || !postAuthor || !postCategory || !postCreatedAt) {
    console.error("PostCard missing required props:", { postId, postAuthor, postCategory, postCreatedAt });
    return null; // Don't render an invalid post
  }

  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(postLikes || 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [pinned, setPinned] = useState(postIsPinned || false);
  const [showComments, setShowComments] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const toggleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(prev => !prev);
  };

  const toggleBookmark = () => {
    setBookmarked(prev => !prev);
  };

  const toggleComments = () => {
    setShowComments(prev => !prev);
  };

  const hidePost = () => {
    setIsHidden(true);
  };

  const showPost = () => {
    setIsHidden(false);
  };
  
  const handleDeletePost = () => {
    if (onDeletePost) {
      onDeletePost(postId);
    }
  };
  
  const handleTogglePin = () => {
    const newPinnedState = !pinned;
    setPinned(newPinnedState);
    if (onPinPost) {
      onPinPost(postId, newPinnedState);
    }
  };

  if (isHidden) {
    return <HiddenPostView showPost={showPost} />;
  }

  // Ensure createdAt is a Date object
  const postDate = postCreatedAt instanceof Date ? postCreatedAt : new Date(postCreatedAt);

  return (
    <Card className="w-full mb-6 overflow-hidden transition-all animate-fade-in">
      {pinned && (
        <div className="bg-brand-50 border-b border-brand-100 flex items-center gap-2 px-4 py-1.5 text-sm text-brand-700">
          <Pin className="h-4 w-4" />
          <span>Post fixado</span>
        </div>
      )}
      
      <CardHeader className="p-0">
        <PostHeader
          author={postAuthor}
          category={postCategory}
          community={postCommunity}
          createdAt={postDate}
          bookmarked={bookmarked}
          toggleBookmark={toggleBookmark}
          hidePost={hidePost}
          isModerator={isModerator}
          onDelete={handleDeletePost}
          onPin={handleTogglePin}
          isPinned={pinned}
          postId={postId}
        />
      </CardHeader>
      
      <CardContent className="p-0">
        <PostContent 
          content={postContent} 
          media={postMedia} 
          poll={postPoll}
          postId={postId}
          onPollVoted={onPostUpdated}
        />
      </CardContent>
      
      <CardFooter className="p-2 flex flex-col">
        <PostActions
          likeCount={likeCount}
          commentCount={postComments || 0}
          liked={liked}
          bookmarked={bookmarked}
          toggleLike={toggleLike}
          toggleComments={toggleComments}
          toggleBookmark={toggleBookmark}
        />
        
        {showComments && (
          <>
            <Separator className="my-2" />
            <CommentSection postId={postId} />
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
