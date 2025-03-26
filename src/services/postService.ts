import { supabase } from "@/integrations/supabase/client";

export interface PostData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string | null | undefined;
  };
  category: {
    id: string;
    name: string;
  };
  createdAt: Date;
  likes: number;
  comments: number;
  isPinned: boolean;
  communityId: string | null;
  media?: {
    type: "image" | "video" | "gif";
    url: string;
    aspectRatio?: number;
  }[];
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, number>;
    userVoted?: string;
  };
}

export interface FetchPostsOptions {
  limit?: number;
  page?: number;
  sort?: "newest" | "oldest";
  communityId?: string | null;
  userId?: string | null;
}

export interface CategoryForm {
  name: string;
  description?: string;
  slug: string;
}

export const uploadGif = async (gifFile: File): Promise<string | null> => {
  try {
    const timestamp = new Date().getTime();
    const gifName = `gif_${timestamp}_${gifFile.name}`;
    
    const { data, error } = await supabase
      .storage
      .from('gifs')
      .upload(gifName, gifFile, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Error uploading GIF:", error);
      return null;
    }
    
    const gifUrl = `https://weuifmgjzkuppqqsoood.supabase.co/storage/v1/object/public/gifs/${data.path}`;
    return gifUrl;
  } catch (error) {
    console.error("Error uploading GIF:", error);
    return null;
  }
};

export const createPost = async ({
  content,
  category_id,
  communityId,
  media,
  poll
}: {
  content: string;
  category_id: string;
  communityId: string | null;
  media?: {
    type: "image" | "video" | "gif";
    url: string;
    aspectRatio?: number;
  }[];
  poll?: {
    question: string;
    options: string[];
  };
}): Promise<string | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    
    if (!user_id) {
      console.error("User not authenticated");
      return null;
    }
    
    const postData: any = {
      content,
      category_id,
      community_id: communityId || null,
      user_id,
      title: content.substring(0, 50)
    };
    
    if (media && media.length > 0) {
      postData.media_data = media;
    }
    
    if (poll) {
      postData.poll_data = poll;
    }
    
    const { data, error } = await supabase
      .from("posts")
      .insert(postData)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating post:", error);
      throw error;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
};

export const votePoll = async (postId: string, optionIndex: number): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.error("User not authenticated");
      return false;
    }
    
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
      
    if (postError) {
      console.error("Error fetching post:", postError);
      return false;
    }
    
    let pollData;
    try {
      if (typeof postData.poll_data === 'string') {
        pollData = JSON.parse(postData.poll_data);
      } else {
        pollData = postData.poll_data;
      }
    } catch (e) {
      console.error("Invalid poll data format:", e);
      return false;
    }
    
    if (!pollData || !pollData.options || optionIndex >= pollData.options.length) {
      console.error("Invalid poll data or option index");
      return false;
    }
    
    const votes = pollData.votes || {};
    const selectedOption = pollData.options[optionIndex];
    
    votes[selectedOption] = (votes[selectedOption] || 0) + 1;
    
    const updatedPollData = {
      ...pollData,
      votes,
      userVotes: {
        ...(pollData.userVotes || {}),
        [userId]: selectedOption
      }
    };
    
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        poll_data: updatedPollData
      })
      .eq("id", postId);
      
    if (updateError) {
      console.error("Error updating poll votes:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error voting on poll:", error);
    return false;
  }
};

export const fetchCategories = async (): Promise<Array<{id: string, name: string, slug: string}>> => {
  try {
    console.log("Buscando categorias da tabela community_categories para posts...");
    const { data, error } = await supabase
      .from('community_categories')
      .select('id, name, slug');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const fetchCommunities = async (): Promise<Array<{id: string, name: string}>> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name');
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching communities:", error);
    return [];
  }
};

export const isValidPost = (post: any): post is Record<string, any> => {
  return post !== null && 
         typeof post === 'object' && 
         !('error' in post && post.error === true);
};

export const fetchPosts = async (
  options: FetchPostsOptions = {}
): Promise<{ posts: PostData[]; totalCount: number }> => {
  try {
    console.log("Fetching posts with options:", options);
    const {
      limit = 10,
      page = 1,
      sort = "newest",
      communityId = null,
      userId = null,
    } = options;

    const offset = (page - 1) * limit;
    
    // Query posts with a comprehensive select statement
    const { data: postsData, error, count } = await supabase
      .from("posts")
      .select(
        `
        id, content, category_id, user_id, community_id,
        created_at, updated_at, likes_count, comments_count,
        is_pinned, title, media_data, poll_data,
        categories:category_id (id, name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: sort === "oldest" });

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
    
    console.log("Posts data fetched:", postsData?.length || 0, "posts");
    
    if (!postsData || postsData.length === 0) {
      console.log("No posts found");
      return { posts: [], totalCount: 0 };
    }

    // Fetch user information for all posts in a separate query
    const userIds = postsData.map(post => post.user_id).filter(Boolean);
    console.log("Fetching user data for", userIds.length, "users");
    
    let usersMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);
        
      if (usersError) {
        console.error("Error fetching user data:", usersError);
      }
      
      if (usersData && usersData.length > 0) {
        console.log("User data fetched:", usersData.length, "users");
        usersMap = usersData.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
      } else {
        console.log("No user data found");
      }
    }

    // Format the posts with the user data
    const formattedPosts: PostData[] = [];

    for (const post of postsData) {
      try {
        if (post && isValidPost(post)) {
          const postId = post.id ?? '';
          const userId = post.user_id ?? '';
          const categoryId = post.category_id ?? '';
          const postContent = post.content ?? '';
          
          // Get user data from our map
          const userData = usersMap[userId];
          
          let author = {
            id: userId,
            name: 'Usuário',
            avatar: null,
          };
          
          if (userData) {
            author = {
              id: userData.id,
              name: userData.full_name || userData.username || 'Usuário',
              avatar: userData.avatar_url,
            };
          }
          
          let createdAt = new Date();
          if (post.created_at && typeof post.created_at === 'string') {
            createdAt = new Date(post.created_at);
          }
          
          let category = { id: 'other', name: 'Other' };
          if (post.categories && typeof post.categories === 'object') {
            category = {
              id: post.categories.id ?? 'other',
              name: post.categories.name ?? 'Other',
            };
          }
          
          const likes = typeof post.likes_count === 'number' ? post.likes_count : 0;
          const comments = typeof post.comments_count === 'number' ? post.comments_count : 0;
          const isPinned = post.is_pinned === true;
          
          let pollData = undefined;
          if (post.poll_data) {
            let parsedPollData;
            try {
              if (typeof post.poll_data === 'string') {
                parsedPollData = JSON.parse(post.poll_data);
              } else {
                parsedPollData = post.poll_data;
              }
              
              if (parsedPollData && typeof parsedPollData === 'object') {
                pollData = {
                  question: parsedPollData.question ?? '',
                  options: Array.isArray(parsedPollData.options) ? parsedPollData.options : [],
                  votes: parsedPollData.votes,
                  userVoted: parsedPollData.userVoted,
                };
              }
            } catch (e) {
              console.error('Error parsing poll data:', e);
            }
          }
          
          const mediaData = [];
          if (post.media_data) {
            let parsedMediaData;
            try {
              if (typeof post.media_data === 'string') {
                parsedMediaData = JSON.parse(post.media_data);
              } else {
                parsedMediaData = post.media_data;
              }
              
              if (parsedMediaData && Array.isArray(parsedMediaData)) {
                for (const media of parsedMediaData) {
                  if (media && typeof media === 'object') {
                    mediaData.push({
                      type: media.type ?? 'image',
                      url: media.url ?? '',
                      aspectRatio: media.aspectRatio,
                    });
                  }
                }
              }
            } catch (e) {
              console.error('Error parsing media data:', e);
            }
          }
          
          formattedPosts.push({
            id: postId,
            content: postContent,
            author,
            category,
            createdAt,
            likes,
            comments,
            isPinned,
            communityId: post.community_id ?? null,
            poll: pollData,
            media: mediaData.length > 0 ? mediaData : undefined,
          });
        }
      } catch (e) {
        console.error('Error processing post:', e, post);
      }
    }

    console.log("Formatted posts:", formattedPosts.length);
    return {
      posts: formattedPosts,
      totalCount: count ?? formattedPosts.length,
    };
  } catch (error) {
    console.error("Error in fetchPosts function:", error);
    return { posts: [], totalCount: 0 };
  }
};

export const addCategory = async (category: CategoryForm): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([category]);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, category: CategoryForm): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};
