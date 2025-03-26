
import DashboardStats from "./DashboardStats";
import UserRankingList from "../rankings/UserRankingList";
import TrendingPostsManagement from "../trending/TrendingPostsManagement";

interface AdminStats {
  users: number;
  posts: number;
  communities: number;
  reports: number;
}

interface DashboardProps {
  stats: AdminStats;
}

export const Dashboard = ({ stats }: DashboardProps) => {
  return (
    <div className="space-y-6">
      <DashboardStats stats={stats} />
      
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <UserRankingList />
        <TrendingPostsManagement />
      </div>
    </div>
  );
};

export default Dashboard;
