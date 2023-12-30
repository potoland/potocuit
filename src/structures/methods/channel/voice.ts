import { ChannelType, VideoQualityMode } from "discord-api-types/v10";
import { BaseChannel } from "./base";

export class VoiceChannelMethods extends BaseChannel<ChannelType> {
	setBitrate(bitrate: number | null, reason?: string) {
		return this.edit({ bitrate }, reason);
	}

	setUserLimit(user_limit: number | null, reason?: string) {
		return this.edit({ user_limit: user_limit ?? 0 }, reason);
	}

	setRTC(rtc_region: string | null, reason?: string) {
		return this.edit({ rtc_region }, reason);
	}

	setVideoQuality(quality: keyof typeof VideoQualityMode, reason?: string) {
		return this.edit({ video_quality_mode: VideoQualityMode[quality] }, reason);
	}
}
