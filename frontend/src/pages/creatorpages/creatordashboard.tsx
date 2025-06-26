import  { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { 
  MapPin, Globe, 
  Edit3, Save, X, Plus, Download, Heart, Bookmark,
  TrendingUp, Users,
   Share2,
  Award, Target, Zap, Activity,
  Grid, Star, 
  BarChart3, LineChartIcon
} from 'lucide-react';

import Gallery  from '@/pages/galleryPage/gallery';
import { useApiGet ,  useApiPost} from '@/hooks/apiHooks';
import ApiRoutes from '@/connectors/api-routes';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams ,useLocation,useNavigate} from 'react-router-dom';

import { useToast } from '@/hooks/use-toast';
import { getErrorMsg } from '@/lib/getErrorMsg';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa6';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CompactFileUploader from '../cdnPages/compactFileUploader';
dayjs.extend(relativeTime);

interface Analytics {
  overview: {
    totalImages: number;
    totalLikes: number;
    totalSaves: number;
    totalDownloads: number;
    avgLikesPerImage: number;
    avgSavesPerImage: number;
    avgDownloadsPerImage: number;
  };
  monthlyStats: {
    _id: {
      month: number;
      year: number;
    };
    imagesCount: number;
    totalLikes: number;
    totalSaves: number;
    totalDownloads: number;
  }[];
  topImages: {
    _id: string;
    title: string;
    imageUrl: string;
    likesCount: number;
    savesCount: number;
    downloadsCount: number;
    engagementScore: number;
    createdAt:Date;
  }[];
  recentActivity: {
    recentImages: number;
    recentLikes: number;
    recentSaves: number;
    recentDownloads: number;
  };
  followerGrowth: {
    _id: {
      month: number;
    };
    newFollowers: number;
  }[];
  creatorInfo: {
    _id:string;
    username: string;
    email: string;
    fullName: string;
    description: string;
    location: string;
    avatar: string;
    coverImage: string;
    links: {
      socialPlatform: string;
      url: string;
    }[];
    createdAt: string;
  };
  followersCount: number;
  followingCount: number;
} 


export default function CreatorDashboard() {
  const [isCreatorView, setIsCreatorView] = useState(true); // Toggle between creator and public view
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<Analytics>();
   const location = useLocation();
  const {creatorId} = useParams();
  const navigate = useNavigate();

  const { toast } = useToast();
  const getCreatorStats=useApiGet({
    key:["getCreatorStats"],
    path:`${ApiRoutes.getCreatorStats}?creatorID=${creatorId}`,
    enabled:false,
  })
 

useEffect(()=>{
  getCreatorStats.refetch()
},[])

useEffect(()=>{
  if(getCreatorStats.isSuccess&&getCreatorStats.data){
    setAnalytics(getCreatorStats.data.data.data)
     setEditableData({
      fullName: getCreatorStats.data.data.data.creatorInfo.fullName ?? '',
      description: getCreatorStats.data.data.data.creatorInfo.description ?? '',
      location: getCreatorStats.data.data.data.creatorInfo.location ?? '',
      links: getCreatorStats.data.data.data.creatorInfo.links ?? []
    });
    if(location.pathname.includes("creator")&&(getCreatorStats.data.data.data.creatorInfo._id !== creatorId)){
      navigate("/")
    }
  }
},[getCreatorStats.isSuccess,getCreatorStats.dataUpdatedAt])

  useEffect(()=>{
    if(creatorId&&location.pathname.includes("creator")){
      setIsCreatorView(false)
    }
     if(location.pathname.includes("creator")&&!creatorId){
    navigate("/")
  }
  },[creatorId,location])
interface EditableData {
  fullName: string;
  description: string;
  location: string;
  links: { socialPlatform: string; url: string }[];
};
  
  // Editable fields
  const [editableData, setEditableData] = useState<EditableData>({
  fullName: '',
  description: '',
  location: '',
  links: []
});
  const updateCreatorDetails=useApiPost({ 
    type: "post",
    key: ["updateCreatorDetails"],
    path: ApiRoutes.updateCreatorDetails,
    sendingFile: false,
  })
  const handleSave = async() => {
    setIsEditing(false);
    const result=await updateCreatorDetails.mutateAsync({
      fullName: editableData.fullName,
      description: editableData.description,
      location: editableData.location,
      links: editableData.links
    });
    if(result.status===200){
      toast({
        title: "Success",
        description: "Creator details updated successfully",
        duration: 5000,
        variant: "success"
      });
      getCreatorStats.refetch()
    }
    else{
      toast({
        title: "Error",
        description: getErrorMsg(updateCreatorDetails),
        duration: 5000,
        variant: "error"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableData({
      fullName: analytics?.creatorInfo.fullName??'',
      description: analytics?.creatorInfo.description??'',
      location: analytics?.creatorInfo.location??'',
      links: analytics?.creatorInfo.links??[]
    });
  };

  const handleAddLink = () => {
    setEditableData({
      ...editableData,
      links: [...editableData.links, { socialPlatform: '', url: '' }]
    });
  };

  const handleRemoveLink = (index:any) => {
    setEditableData({
      ...editableData,
      links: editableData?.links?.filter((_, i) => i !== index)
    });
  };

  const getSocialIcon = (platform: string) => {
    platform.toLowerCase()
    switch (platform) {
      case 'instagram': return <FaInstagram className="w-4 h-4" />;
      case 'youtube': return <FaYoutube className="w-4 h-4" />;
      case 'twitter': return <FaTwitter className="w-4 h-4" />;
      case 'facebook': return <FaFacebook className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };
  function formatNumber(value: number): string {
  if (value < 1000) {
    return value.toString();
  } else if (value < 1_000_000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (value < 1_000_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else {
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
}
const [openUploader, setOpenUploader] = useState(false);
const sendFollow=useApiPost({
  type:"post",
  path:ApiRoutes.follow,
  key:["follow"],
  sendingFile:false,
})
const handleFollow=async()=>{
 await sendFollow.mutateAsync({

  creatorID:creatorId
 })
}
useEffect(()=>{
  if(sendFollow.isSuccess){
    getCreatorStats.refetch()
    toast({
      title: "Success",
      description: sendFollow.data.data.message,
      duration: 5000,
      variant: "success"
    });
  }
  else if(sendFollow.isError){
    toast({
      title: "Error",
      description: getErrorMsg(sendFollow),
      duration: 5000,
      variant: "error"
    });
  }
},[sendFollow.isSuccess,sendFollow.isError,toast])
  const renderHeader = () => (
    <div className="relative">
      {/* Cover Image */}
      {isCreatorView?(
        <>
       <ContextMenu>
  <ContextMenuTrigger>
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-t-2xl">
       
        <img 
          src={analytics?.creatorInfo.coverImage}
          alt="Cover Image"
          className="w-full h-full object-cover"
        />
      
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {isCreatorView && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={() => setIsCreatorView(!isCreatorView)}
              variant="outline"
              size="sm"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
            >
              {isCreatorView ? 'Public View' : 'Creator View'}
            </Button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="bg-primary/20 backdrop-blur-sm border-primary/30 text-white hover:bg-primary/30"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-green-500/20 backdrop-blur-sm border-green-500/30 text-white hover:bg-green-500/30"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  className="bg-red-500/20 backdrop-blur-sm border-red-500/30 text-white hover:bg-red-500/30"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
        </ContextMenuTrigger>
          <ContextMenuContent>
    <ContextMenuItem className='cursor-pointer'onClick={()=>setOpenUploader(true)}><Edit3 className="w-4 h-4 mr-2" />Edit Cover Image</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
<Dialog open={openUploader} onOpenChange={setOpenUploader} >
<DialogContent className=" w-full">
<DialogHeader>
<DialogTitle className="flex items-center gap-2">
<Edit3 className="w-5 h-5" />
Edit Cover Image
</DialogTitle>
<DialogDescription>
Upload a new cover image for your creator profile
</DialogDescription>
</DialogHeader>
<div className="space-y-4">
<CompactFileUploader  purpose='coverImage' allowedFileType='image' onSuccess={()=>{setOpenUploader(false)
getCreatorStats.refetch()
}}/>
</div>
</DialogContent>
</Dialog>

</>

):(
  <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-t-2xl">
       
        <img 
          src={analytics?.creatorInfo.coverImage}
          alt="Cover Image"
          className="w-full h-full object-cover"
        />
      
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {isCreatorView && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={() => setIsCreatorView(!isCreatorView)}
              variant="outline"
              size="sm"
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 test"
            >
              {isCreatorView ? 'Public View' : 'Creator View'}
            </Button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="bg-primary/20 backdrop-blur-sm border-primary/30 text-white hover:bg-primary/30"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-green-500/20 backdrop-blur-sm border-green-500/30 text-white hover:bg-green-500/30"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                  className="bg-red-500/20 backdrop-blur-sm border-red-500/30 text-white hover:bg-red-500/30"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
)

}
      {/* Profile Section */}
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="relative -mt-20 flex flex-col md:flex-row items-start md:items-end gap-6 pb-8">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-2xl">
              <AvatarImage src={analytics?.creatorInfo.avatar} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {analytics?.creatorInfo.fullName?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            {/* Verification Badge */}
             <div className='text-[14px] leading-[1.4] antialiased font-sans box-border absolute right-0 bottom-0'></div>
            <Tooltip>
              <TooltipTrigger className='text-[14px] leading-[1.4] antialiased font-sans box-border absolute right-0 bottom-0'>
           

              <div className='text-[14px] leading-[1.4] antialiased w-[40px] h-[40px] box-border font-sans'>
                    
              <svg viewBox="0 0 24 24" width="24" height="24" className='text-[14px] leading-[1.4] antialiased font-sans box-border m-0 absolute top-0 left-0 w-full h-full fill-[#54ca84]'>
               <path d="M15.057 1.207a1.59 1.59 0 0 1 2.312 0.944l0.742 2.571a1.591 1.591 0 0 0 1.104 1.093l2.579 0.715a1.59 1.59 0 0 1 0.967 2.302l-1.294 2.343a1.591 1.591 0 0 0 0.008 1.553l1.318 2.33a1.59 1.59 0 0 1 -0.944 2.311l-2.571 0.742a1.591 1.591 0 0 0 -1.093 1.104l-0.715 2.579a1.59 1.59 0 0 1 -2.302 0.967l-2.343 -1.294a1.591 1.591 0 0 0 -1.553 0.008l-2.33 1.318a1.59 1.59 0 0 1 -2.311 -0.944l-0.742 -2.571a1.591 1.591 0 0 0 -1.104 -1.093L2.206 17.47A1.59 1.59 0 0 1 1.239 15.168l1.294 -2.343a1.591 1.591 0 0 0 -0.008 -1.553l-1.318 -2.33a1.59 1.59 0 0 1 0.944 -2.311l2.571 -0.742a1.591 1.591 0 0 0 1.093 -1.104l0.715 -2.579A1.59 1.59 0 0 1 8.832 1.239l2.343 1.294a1.591 1.591 0 0 0 1.553 -0.008z"/>
                </svg>
              <div className='text-[14px] leading-[1.4] antialiased font-sans box-border m-0 flex relative z-[1] h-full justify-center items-center'>
                <p className='text-[17px] leading-[150%] tracking-[-0.5px] antialiased font-sans font-bold box-border m-0 block bg-transparent border-none outline-none text-white fill-white'>
                  {dayjs().diff(dayjs(analytics?.creatorInfo.createdAt),"year")}
                </p>
              </div>
              </div>
          
             </TooltipTrigger>
  <TooltipContent side='right'>
    <p>{dayjs().diff(dayjs(analytics?.creatorInfo.createdAt),"year")} years ago</p>
  </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="bg-transparent backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              {!isEditing ? (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-50 mb-2">
                    {editableData?.fullName}
                  </h1>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {editableData?.description}
                  </p>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{editableData?.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {editableData?.links?.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-gray-500 hover:bg-gray-400 transition-colors"
                        >
                          {getSocialIcon(link.socialPlatform)}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <Input
                    value={editableData?.fullName}
                    onChange={(e) => setEditableData({...editableData, fullName: e.target.value})}
                    className="text-2xl font-bold border-2"
                    placeholder="Full Name"

                  />
                  <Textarea
                    value={editableData?.description}
                    onChange={(e) => setEditableData({...editableData, description: e.target.value})}
                    rows={3}
                    className="border-2"
                    placeholder="Description"
                    
                    maxLength={500}
                  />
                  <Input
                    value={editableData?.location}
                    onChange={(e) => setEditableData({...editableData, location: e.target.value})}
                    className="border-2"
                    placeholder="Location"
                  />
                  
                  {/* Social Links Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Social Links</h4>
                      <Button onClick={handleAddLink} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                    {editableData?.links?.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                        value={link.socialPlatform}
  onValueChange={(value) => {
    const newLinks = [...editableData.links];
    newLinks[index].socialPlatform = value;
    setEditableData({ ...editableData, links: newLinks });
  }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a platform"  />
                          </SelectTrigger>
                          <SelectContent className='text-white'>
                          <SelectItem value="platform">Platform</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                        </SelectContent>
                        </Select>
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...editableData.links];
                            newLinks[index].url = e.target.value;
                            setEditableData({...editableData, links: newLinks});
                          }}
                          placeholder="URL"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleRemoveLink(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white/80">{analytics?.followersCount?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white/80">{analytics?.overview.totalImages}</p>
                  <p className="text-sm text-gray-500">Images</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white/80">{formatNumber(Number(((((analytics?.overview.totalLikes ?? 0) +(analytics?.overview.totalSaves ?? 0) +(analytics?.overview.totalDownloads ?? 0)) / 3)).toFixed(2)))}</p>
                  <p className="text-sm text-gray-500">Total Engagement</p>
                </div>
              </div>

              {/* Action Buttons */}
              {!isCreatorView && (
                <div className="flex gap-3 mt-6">
                  <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  onClick={handleFollow}
                  disabled={sendFollow.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Follow
                  </Button>
                  <Button variant="outline" onClick={()=>{navigator.clipboard.writeText(window.location.href??"")
                  toast({
                    title: "Success",
                    description: "Link copied to clipboard",
                    duration: 3000,
                    variant: "success"
                    });
                  }}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="border-b  bg-transparent backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'gallery', label: 'Gallery', icon: Grid, count: analytics?.overview.totalImages },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'audience', label: 'Audience', icon: Users, count: analytics?.followersCount },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tab.count > 1000 ? `${(tab.count/1000).toFixed(1)}k` : tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Likes</p>
                <p className="text-3xl font-bold mt-1">{analytics?.overview.totalLikes?.toLocaleString()}</p>
                <p className="text-blue-200 text-xs mt-1">↑ 12% this month</p>
              </div>
              <Heart className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Downloads</p>
                <p className="text-3xl font-bold mt-1">{analytics?.overview.totalDownloads?.toLocaleString()}</p>
                <p className="text-green-200 text-xs mt-1">↑ 8% this month</p>
              </div>
              <Download className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Saves</p>
                <p className="text-3xl font-bold mt-1">{analytics?.overview.totalSaves?.toLocaleString()}</p>
                <p className="text-purple-200 text-xs mt-1">↑ 15% this month</p>
              </div>
              <Bookmark className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Avg. Engagement</p>
                <p className="text-3xl font-bold mt-1">{formatNumber(Number(((
                  (analytics?.overview.avgLikesPerImage ??0)+(analytics?.overview.avgSavesPerImage??0)+(analytics?.overview.avgDownloadsPerImage??0))/3).toFixed(2)))}</p>
                <p className="text-orange-200 text-xs mt-1">per image</p>
              </div>
              <Target className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics?.monthlyStats}>
                <XAxis dataKey="_id.month" />
                <YAxis />
                <Area type="monotone" dataKey="totalLikes" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="totalSaves" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="totalDownloads" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Follower Growth */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Follower Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.followerGrowth}>
                <XAxis dataKey="_id.month" />
                <YAxis />
                <Line type="monotone" dataKey="newFollowers" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Images */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performing Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics?.topImages.slice(0, 6).map((image, index) => (
              <div key={image._id} className="relative group overflow-hidden rounded-lg">
                <img 
                  src={image.imageUrl} 
                  alt={image.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="font-semibold mb-2">{image.title}</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {image.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {image.downloadsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {image.engagementScore}
                    </span>
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

const RenderGallery = () => {

  return (
    <div className="space-y-6">
      {/* Gallery Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-2xl font-bold text-gray-900">{analytics?.overview.totalImages}</p>
          <p className="text-sm text-gray-500">Images</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.overview.totalLikes}
          </p>
          <p className="text-sm text-gray-500">Total Likes</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.overview.totalDownloads}
          </p>
          <p className="text-sm text-gray-500">Total Downloads</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-2xl font-bold text-gray-900">
            {analytics?.overview.totalSaves}
          </p>
          <p className="text-sm text-gray-500">Total Saves</p>
        </div>
      </div>
      <Gallery
      creatorId={`${creatorId}`}
      />
    </div>
  );
};

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Engagement Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Likes', value: analytics?.overview.totalLikes, color: '#3b82f6' },
                    { name: 'Downloads', value: analytics?.overview.totalDownloads, color: '#10b981' },
                    { name: 'Saves', value: analytics?.overview.totalSaves, color: '#f59e0b' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: 'Likes', value: analytics?.overview.totalLikes, color: '#3b82f6' },
                    { name: 'Downloads', value: analytics?.overview.totalDownloads, color: '#10b981' },
                    { name: 'Saves', value: analytics?.overview.totalSaves, color: '#f59e0b' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Images</span>
                <span className="font-semibold">{analytics?.recentActivity.recentImages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Likes Received</span>
                <span className="font-semibold">{analytics?.recentActivity.recentLikes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Downloads</span>
                <span className="font-semibold">{analytics?.recentActivity.recentDownloads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Saves</span>
                <span className="font-semibold">{analytics?.recentActivity.recentSaves}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Monthly Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics?.monthlyStats}>
                <XAxis dataKey="_id.month" />
                <YAxis />
                <Bar dataKey="totalLikes" fill="#3b82f6" />
                <Bar dataKey="totalDownloads" fill="#10b981" />
                <Bar dataKey="totalSaves" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Avg. Likes per Image</span>
                  <span className="text-sm font-medium">{analytics?.overview.avgLikesPerImage.toFixed(2)}</span>
                </div>
                  <Progress value={((analytics?.overview.avgLikesPerImage??0) / 100) * 100} color="#4e80ee" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Avg. Downloads per Image</span>
                  <span className="text-sm font-medium">{analytics?.overview.avgDownloadsPerImage.toFixed(2)}</span>
                </div>
  
                <Progress value={((analytics?.overview.avgDownloadsPerImage??0) / 100) * 100} color="#55b685" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Avg. Saves per Image</span>
                  <span className="text-sm font-medium">{analytics?.overview.avgSavesPerImage.toFixed(2)}</span>
                </div>
                
                <Progress value={((analytics?.overview.avgSavesPerImage??0) / 50) * 100} color="#e9a23b" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-8">
      {/* Audience Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{analytics?.followersCount?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Followers</p>
                <p className="text-xs text-green-600 mt-1">↑ 12.5% this month</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{analytics?.followingCount}</p>
                <p className="text-sm text-gray-500">Following</p>
                <p className="text-xs text-blue-600 mt-1">Active connections</p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Audience Growth Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Audience Growth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics?.followerGrowth}>
              <XAxis dataKey="_id.month" />
              <YAxis />
              <Line 
                type="monotone" 
                dataKey="newFollowers" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>


    </div>
  );


  if(getCreatorStats.isFetching){
    return (
      <div className="min-h-screen flex items-center justify-center">
 
        <div className="relative mb-8 opacity-40">
                              <div className="w-24 h-24 border-4 border-muted border-t-primary rounded-full animate-spin" />
                              <div className="absolute inset-2 w-16 h-16 border-4 border-muted border-b-primary rounded-full animate-spin" />
                              <div className="absolute inset-4 w-8 h-8 border-4 border-muted border-l-primary rounded-full animate-spin" />
                            </div>
      </div>
    )
  }
  if(getCreatorStats.isError){
    return (
       <div className="min-h-screen flex items-center justify-center flex-col">
        <div className="text-lg text-red-600">
          Error loading the dashboard please try again
          <br />
          <small>{getCreatorStats.error?.message}</small>
        </div>
      </div>
    )
  }
return (
  <div className="min-h-screen ">
    {renderHeader()}
    {renderTabs()}
    
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'gallery' && (
        <RenderGallery 
        />
      )}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'audience' && renderAudience()}

    </div>
  </div>
);
}