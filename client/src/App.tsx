import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Chatbox from "@/components/chatbox";
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import ReportPage from "@/pages/report";
import BlogsPage from "@/pages/blogs";
import BlogDetail from "@/pages/blog-detail";
import Detail from "@/pages/detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/report" component={ReportPage} />
      <Route path="/blogs" component={BlogsPage} />
      <Route path="/blogs/:slug" component={BlogDetail} />
      <Route path="/detail/:id" component={Detail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Router />
        </Layout>
        <Chatbox />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
