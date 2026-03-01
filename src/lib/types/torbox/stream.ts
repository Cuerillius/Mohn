import type { ApiResponse } from './api';
import type { Metadata, ResourceType } from './search';

export interface VideoStreamMetadata {
	index: number;
	codec_type: 'video';
	codec: string;
	width: number;
	height: number;
	frame_rate: string;
	pixel_format: string;
	bitrate: string;
	duration: string;
	total_chunks: number;
	file_name: string;
	opensubtitles_hash: string;
	size: number;
	title: string;
	title_data: {
		resolution: string;
		quality: string;
		year: number;
		codec: string;
		audio: string;
		filetype: string;
		network: string;
		title: string;
		encoder: string;
	};
}

export interface AudioStreamMetadata {
	index: number;
	codec_type: 'audio';
	codec: string;
	default: boolean;
	sample_rate: string;
	channels: number;
	channel_layout: string;
	language: string;
	language_full: string;
	title: string | null;
}

export interface SubtitleStreamMetadata {
	index: number;
	codec_type: 'subtitle';
	codec: string;
	default: boolean;
	language: string;
	language_full: string;
	title: string | null;
}

export interface StreamData {
	id: number;
	file_id: number;
	auth_id: string;
	name: string;
	short_name: string;
	s3_path: string;
	size: number;
	mimetype: string;
	hash: string;
	open_subtitles_hash: string;
	type: ResourceType;
	region: string;
	domain: string;
	user_token: string;
	webdav_url: string;
	intro_information: {
		start_time: number;
		end_time: number;
		title: string | null;
	};
	scrobbling_enabled: boolean;
	hls_url: string;
	presigned_token: string;
	subtitle_index: string | number;
	audio_index: number;
	resolution_index: string | number;
	is_transcoding: boolean;
	needs_transcoding: boolean;
	metadata: {
		video: VideoStreamMetadata;
		audios: AudioStreamMetadata[];
		subtitles: SubtitleStreamMetadata[];
		thumbnail: string;
		chapters: string;
	};
	search_metadata: Metadata;
}

export type StreamDataResponse = ApiResponse<StreamData>;
