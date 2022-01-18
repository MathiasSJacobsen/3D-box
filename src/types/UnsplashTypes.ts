export interface Urls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

export interface Links {
  self: string;
  html: string;
  download: string;
  download_location: string;
}

export interface ArchitectureInterior {
  status: string;
  approved_on: Date;
}

export interface Interiors {
  status: string;
  approved_on: Date;
}

export interface TopicSubmissions {
  architecture_interior: ArchitectureInterior;
  interiors: Interiors;
}

export interface Links2 {
  self: string;
  html: string;
  photos: string;
  likes: string;
  portfolio: string;
  following: string;
  followers: string;
}

export interface ProfileImage {
  small: string;
  medium: string;
  large: string;
}

export interface Social {
  instagram_username: string;
  portfolio_url: string;
  twitter_username: string;
  paypal_email?: any;
}

export interface User {
  id: string;
  updated_at: Date;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  twitter_username: string;
  portfolio_url: string;
  bio: string;
  location: string;
  links: Links2;
  profile_image: ProfileImage;
  instagram_username: string;
  total_collections: number;
  total_likes: number;
  total_photos: number;
  accepted_tos: boolean;
  for_hire: boolean;
  social: Social;
}

export interface Tag {
  type: string;
  title: string;
}

export interface Result {
  id: string;
  created_at: Date;
  updated_at: Date;
  promoted_at: Date;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string;
  alt_description: string;
  urls: Urls;
  links: Links;
  categories: any[];
  likes: number;
  liked_by_user: boolean;
  current_user_collections: any[];
  sponsorship?: any;
  topic_submissions: TopicSubmissions;
  user: User;
  tags: Tag[];
}

export type UnsplashSearchResponseType = {
  total: number;
  total_pages: number;
  results: Result[];
}
