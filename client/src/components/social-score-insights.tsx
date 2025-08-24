import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTierFromScore, getTierColor } from './social-score-indicator';

export function SocialScoreInsights() {
  const { data: socialScore, isLoading } = useQuery<{
    currentScore: number;
    stats: { views: number; clicks: number; ctr: number };
    historicalData: Array<{ date: string; score: number; views: number; clicks: number }>;
    compareData: Array<{ category: string; userScore: number; avgScore: number }>;
    followers?: number;
    following?: number;
    insights?: string;
  }>({
    queryKey: ['/api/social-score'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 w-full bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="h-64 w-full bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }
  
  const historicalData = socialScore?.historicalData || [];
  const compareData = socialScore?.compareData || [];
  
  // Add colors to comparison data
  const enhancedCompareData = compareData.map((item: { category: string; userScore: number; avgScore: number }) => ({
    ...item,
    userColor: '#3b82f6',
    avgColor: '#94a3b8'
  }));

  return (
    <div className="space-y-6">
      {socialScore?.insights && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            {socialScore.insights}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Social Score Trends
          </CardTitle>
          <CardDescription>
            Track your score progression over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="score">
            <TabsList className="mb-4">
              <TabsTrigger value="score">Score History</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="score" className="mt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any) => [`${value}`, 'Score']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="engagement" className="mt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [value, name === 'views' ? 'Profile Views' : 'Link Clicks']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#8884d8"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enhancedCompareData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        `${value}`, 
                        name === 'userScore' ? 'Your Score' : 'Average'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="userScore" 
                      name="Your Score" 
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                    <Bar 
                      dataKey="avgScore" 
                      name="Average" 
                      fill="#94a3b8"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => window.location.href = '/analytics'}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-base-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-base-300 bg-base-100 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer"
            >
              View detailed analysis
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Social Network Metrics</CardTitle>
            <CardDescription>
              Your connection stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around p-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{socialScore?.followers || 0}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{socialScore?.following || 0}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {(socialScore?.followers || 0) > 0 
                    ? ((socialScore?.following || 0) / (socialScore?.followers || 1)).toFixed(1) 
                    : '0.0'}
                </div>
                <div className="text-sm text-gray-500">Ratio</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimization Tips</CardTitle>
            <CardDescription>
              Ways to improve your score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6L9 17l-5-5"></path></svg>
                </div>
                <span>Add more social media links to increase your reach</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6L9 17l-5-5"></path></svg>
                </div>
                <span>Complete your profile with a bio and profile image</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6L9 17l-5-5"></path></svg>
                </div>
                <span>Enable Pitch Mode to optimize for professional presentations</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 6L9 17l-5-5"></path></svg>
                </div>
                <span>Use the Smart Link AI feature to optimize your link ordering</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}