import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Chatbox from "@/components/chatbox";
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import ScamSearchPage from "@/pages/scam-search";
import ReportPage from "@/pages/report";
import BlogsPage from "@/pages/blogs";
import BlogDetail from "@/pages/blog-detail";
import Detail from "@/pages/detail";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminReports from "@/pages/admin/reports";
import AdminBlogs from "@/pages/admin/blogs";
import AdminChat from "@/pages/admin/chat";
import AdminUsers from "@/pages/admin/users";
import ChatDetail from "@/pages/admin/chat-detail";
import BroadcastPage from "@/pages/admin/broadcast";

// HOC to wrap public pages with Layout and Chatbox
function withLayout(Component: any) {
  return (props: any) => (
    <>
      <Layout>
        <Component {...props} />
      </Layout>
      <Chatbox />
    </>
  );
}

const HomeWithLayout = withLayout(Home);
const SearchWithLayout = withLayout(SearchPage);
const ScamSearchWithLayout = withLayout(ScamSearchPage);
const ReportWithLayout = withLayout(ReportPage);
const BlogsWithLayout = withLayout(BlogsPage);
const BlogDetailWithLayout = withLayout(BlogDetail);
const DetailWithLayout = withLayout(Detail);
const NotFoundWithLayout = withLayout(NotFound);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          {/* Admin routes - no layout, no chatbox */}
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/reports" component={AdminReports} />
          <Route path="/admin/blogs" component={AdminBlogs} />
          <Route path="/admin/chat" component={AdminChat} />
          <Route path="/admin/chat/:sessionId" component={ChatDetail} />
          <Route path="/admin/broadcast" component={BroadcastPage} />
          <Route path="/admin/users" component={AdminUsers} />
          
          {/* Public routes with layout and chatbox */}
          <Route path="/" component={HomeWithLayout} />
          <Route path="/search" component={SearchWithLayout} />
          <Route path="/scam-search" component={ScamSearchWithLayout} />
          <Route path="/report" component={ReportWithLayout} />
          <Route path="/blogs" component={BlogsWithLayout} />
          <Route path="/blogs/:slug" component={BlogDetailWithLayout} />
          <Route path="/detail/:id" component={DetailWithLayout} />
          
          {/* 404 for all other routes */}
          <Route component={NotFoundWithLayout} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
