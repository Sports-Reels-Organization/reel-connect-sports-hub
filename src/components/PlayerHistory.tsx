import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Download,
  Eye,
  Users,
  Upload,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UploadHistory {
  id: string;
  filename: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  uploaded_at: string;
  total_players: number;
  success_count: number;
  error_count: number;
  uploaded_by: string;
  upload_type: 'bulk' | 'manual';
  details?: any;
}

interface PlayerActivity {
  id: string;
  player_name: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
  user_id: string;
  details?: string;
  is_deleted_player?: boolean; // Flag to identify activities for deleted players
}

const PlayerHistory: React.FC<{ teamId: string }> = ({ teamId }) => {
  const { toast } = useToast();
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [playerActivity, setPlayerActivity] = useState<PlayerActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadHistory | null>(null);
  
  // Search and filter states
  const [uploadSearchTerm, setUploadSearchTerm] = useState('');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [uploadDateFilter, setUploadDateFilter] = useState('');
  const [activityDateFilter, setActivityDateFilter] = useState('');
  
  // Pagination states
  const [uploadCurrentPage, setUploadCurrentPage] = useState(1);
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    console.log('PlayerHistory useEffect triggered, teamId:', teamId);
    if (teamId) {
      fetchUploadHistory();
      fetchPlayerActivity();
    }
  }, [teamId]);

  const fetchUploadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('player_upload_history')
        .select('*')
        .eq('team_id', teamId)
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Upload history table not available:', error.message);
        setUploadHistory([]);
        return;
      }
      setUploadHistory(data || []);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      setUploadHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerActivity = async () => {
    try {
      console.log('Fetching player activity for team:', teamId);
      
      // Use the new simplified table
      const { data, error } = await supabase
        .from('player_activities')
        .select('*')
        .eq('team_id', teamId)
        .order('performed_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching player activity:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        setPlayerActivity([]);
        return;
      }

      console.log('Raw activity data from database:', data);
      console.log('Number of records:', data?.length || 0);

      const activityData: PlayerActivity[] = (data || []).map(item => {
        console.log('Processing activity item:', item);
        
        // For deleted players, player_id might be NULL, but player_name should always be there
        const playerName = item.player_name || 
                          item.old_data?.full_name || 
                          item.new_data?.full_name || 
                          'Unknown Player';
        
        const processedItem = {
          id: item.id,
          player_name: playerName,
          action: item.action,
          timestamp: item.performed_at,
          user_id: item.performed_by || '',
          details: item.details || '',
          is_deleted_player: item.player_id === null // Flag to identify deleted player activities
        };
        
        console.log('Processed item:', processedItem);
        return processedItem;
      });

      console.log('Final processed activity data:', activityData);
      setPlayerActivity(activityData);
    } catch (error) {
      console.error('Error fetching player activity:', error);
      setPlayerActivity([]);
    }
  };

  const downloadUploadDetails = (upload: UploadHistory) => {
    const details = {
      filename: upload.filename,
      uploadDate: new Date(upload.uploaded_at).toLocaleString(),
      totalPlayers: upload.total_players,
      successCount: upload.success_count,
      errorCount: upload.error_count,
      uploadType: upload.upload_type,
      details: upload.details
    };

    const blob = new Blob([JSON.stringify(details, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `upload_details_${upload.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadOriginalFile = async (upload: UploadHistory) => {
    if (!upload.file_path) {
      toast({
        title: "File Not Available",
        description: "Original file is not available for download",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('player-uploads')
        .createSignedUrl(upload.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = upload.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download original file",
        variant: "destructive"
      });
    }
  };

  const previewFile = async (upload: UploadHistory) => {
    if (!upload.file_path) {
      toast({
        title: "File Not Available",
        description: "Original file is not available for preview",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('player-uploads')
        .createSignedUrl(upload.file_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        // Open in new tab for preview
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to preview file",
        variant: "destructive"
      });
    }
  };

  const previewUpload = (upload: UploadHistory) => {
    setSelectedUpload(upload);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case 'updated':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'deleted':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-500';
      case 'updated':
        return 'bg-blue-500';
      case 'deleted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUploadTypeIcon = (type: string) => {
    return type === 'bulk' ? <Upload className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />;
  };

  // Filter functions
  const filterUploadHistory = (uploads: UploadHistory[]) => {
    return uploads.filter(upload => {
      const filename = upload.filename || '';
      const uploadType = upload.upload_type || '';
      
      const matchesSearch = filename.toLowerCase().includes(uploadSearchTerm.toLowerCase()) ||
                           uploadType.toLowerCase().includes(uploadSearchTerm.toLowerCase());
      
      const matchesDate = !uploadDateFilter || 
                         (upload.uploaded_at && new Date(upload.uploaded_at).toDateString() === new Date(uploadDateFilter).toDateString());
      
      return matchesSearch && matchesDate;
    });
  };

  const filterPlayerActivity = (activities: PlayerActivity[]) => {
    return activities.filter(activity => {
      const playerName = activity.player_name || '';
      const action = activity.action || '';
      const details = activity.details || '';
      
      const matchesSearch = playerName.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
                           action.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
                           details.toLowerCase().includes(activitySearchTerm.toLowerCase());
      
      const matchesDate = !activityDateFilter || 
                         (activity.timestamp && new Date(activity.timestamp).toDateString() === new Date(activityDateFilter).toDateString());
      
      return matchesSearch && matchesDate;
    });
  };

  // Pagination functions
  const getPaginatedData = <T,>(data: T[], currentPage: number) => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / recordsPerPage);
  };

  // Get filtered and paginated data
  const filteredUploadHistory = filterUploadHistory(uploadHistory || []);
  const filteredPlayerActivity = filterPlayerActivity(playerActivity || []);
  
  const paginatedUploadHistory = getPaginatedData(filteredUploadHistory, uploadCurrentPage);
  const paginatedPlayerActivity = getPaginatedData(filteredPlayerActivity, activityCurrentPage);

  const uploadTotalPages = getTotalPages(filteredUploadHistory);
  const activityTotalPages = getTotalPages(filteredPlayerActivity);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="uploads" className="text-white">
            <Upload className="h-4 w-4 mr-2" />
            Upload History
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-white">
            <Users className="h-4 w-4 mr-2" />
            Player Activity
          </TabsTrigger>
        </TabsList>

        {/* Upload History Tab */}
        <TabsContent value="uploads" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload History ({filteredUploadHistory.length})
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Track all bulk uploads and manual player additions
              </p>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search uploads..."
                      value={uploadSearchTerm}
                      onChange={(e) => {
                        setUploadSearchTerm(e.target.value);
                        setUploadCurrentPage(1); // Reset to first page when searching
                      }}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Input
                    type="date"
                    value={uploadDateFilter}
                    onChange={(e) => {
                      setUploadDateFilter(e.target.value);
                      setUploadCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading history...</p>
                </div>
              ) : filteredUploadHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {uploadHistory.length === 0 ? 'No upload history found' : 'No uploads match your search criteria'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedUploadHistory.map((upload) => (
                    <div key={upload.id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getUploadTypeIcon(upload.upload_type)}
                          <div>
                            <h4 className="text-white font-medium">{upload.filename}</h4>
                            <p className="text-gray-400 text-sm">
                              {formatDate(upload.uploaded_at)} • {upload.upload_type === 'bulk' ? 'Bulk Upload' : 'Manual Addition'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewUpload(upload)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          {upload.file_path && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => previewFile(upload)}
                                className="text-purple-400 hover:text-purple-300"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Preview File
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadOriginalFile(upload)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download File
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadUploadDetails(upload)}
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Export Details
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{upload.total_players}</div>
                          <div className="text-xs text-gray-400">Total Players</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{upload.success_count}</div>
                          <div className="text-xs text-gray-400">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">{upload.error_count}</div>
                          <div className="text-xs text-gray-400">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {Math.round((upload.success_count / upload.total_players) * 100)}%
                          </div>
                          <div className="text-xs text-gray-400">Success Rate</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {upload.success_count} Success
                        </Badge>
                        {upload.error_count > 0 && (
                          <Badge variant="outline" className="text-red-400 border-red-400">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {upload.error_count} Errors
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(upload.uploaded_at)}
                        </Badge>
                      </div>
                    </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {uploadTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        Showing {((uploadCurrentPage - 1) * recordsPerPage) + 1} to {Math.min(uploadCurrentPage * recordsPerPage, filteredUploadHistory.length)} of {filteredUploadHistory.length} uploads
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={uploadCurrentPage === 1}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-400 px-3">
                          Page {uploadCurrentPage} of {uploadTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadCurrentPage(prev => Math.min(prev + 1, uploadTotalPages))}
                          disabled={uploadCurrentPage === uploadTotalPages}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Activity Log ({filteredPlayerActivity.length})
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Track individual player changes and updates
              </p>
              
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search activities..."
                      value={activitySearchTerm}
                      onChange={(e) => {
                        setActivitySearchTerm(e.target.value);
                        setActivityCurrentPage(1); // Reset to first page when searching
                      }}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Input
                    type="date"
                    value={activityDateFilter}
                    onChange={(e) => {
                      setActivityDateFilter(e.target.value);
                      setActivityCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button 
                  onClick={async () => {
                    console.log('Manual fetch triggered for teamId:', teamId);
                    setLoading(true);
                    await fetchPlayerActivity();
                    setLoading(false);
                  }}
                  size="sm"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading activities...</p>
                </div>
              ) : filteredPlayerActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {playerActivity.length === 0 ? 'No player activity found' : 'No activities match your search criteria'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">Try creating, editing, or deleting a player</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedPlayerActivity.map((activity) => (
                    <div key={activity.id} className={`bg-gray-700 p-4 rounded-lg ${activity.is_deleted_player ? 'border-l-4 border-red-500' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{activity.player_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.action.toUpperCase()}
                            </Badge>
                            {activity.is_deleted_player && (
                              <Badge variant="outline" className="text-red-400 border-red-400 text-xs">
                                DELETED PLAYER
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{activity.details}</p>
                          <p className="text-gray-500 text-xs">
                            {formatDate(activity.timestamp)}
                            {activity.is_deleted_player && (
                              <span className="text-red-400 ml-2">• Player no longer in roster</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {activityTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        Showing {((activityCurrentPage - 1) * recordsPerPage) + 1} to {Math.min(activityCurrentPage * recordsPerPage, filteredPlayerActivity.length)} of {filteredPlayerActivity.length} activities
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={activityCurrentPage === 1}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-400 px-3">
                          Page {activityCurrentPage} of {activityTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityCurrentPage(prev => Math.min(prev + 1, activityTotalPages))}
                          disabled={activityCurrentPage === activityTotalPages}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Preview Modal */}
      {selectedUpload && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Upload Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUpload(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Filename</label>
                  <p className="text-white">{selectedUpload.filename}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Upload Date</label>
                  <p className="text-white">{formatDate(selectedUpload.uploaded_at)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Total Players</label>
                  <p className="text-white">{selectedUpload.total_players}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Success Count</label>
                  <p className="text-green-400">{selectedUpload.success_count}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Error Count</label>
                  <p className="text-red-400">{selectedUpload.error_count}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Upload Type</label>
                  <p className="text-white capitalize">{selectedUpload.upload_type}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerHistory;
