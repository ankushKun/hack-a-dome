import { Audio, Video } from '@huddle01/react/components';
import {
    useRemoteAudio,
    useRemoteScreenShare,
    useRemoteVideo,
    useRemotePeer,
} from '@huddle01/react/hooks';
import React from 'react';
import { MicOff } from 'lucide-react';

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
type Props = {
    peerId: string;
};

const RemotePeer = ({ peerId }: Props) => {
    const { metadata } = useRemotePeer<{ displayName: string }>({ peerId });
    const { stream } = useRemoteVideo({ peerId });
    const { stream: audioStream, state: audioState } = useRemoteAudio({ peerId });
    const { videoStream: screenVideo, audioStream: screenAudio } =
        useRemoteScreenShare({ peerId });

    return (
        <>
            {/* Video Stream */}
            {stream && (
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
                    <Video
                        stream={stream}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                            {metadata?.displayName || 'Guest'}
                        </span>

                        {audioState === 'unavailable' && (
                            <span className="bg-black/50 p-1.5 rounded-lg text-white">
                                <MicOff className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Screen Share */}
            {screenVideo && (
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <Video
                        stream={screenVideo}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                        {metadata?.displayName || 'Guest'}'s Screen
                    </div>
                </div>
            )}

            {/* Audio Streams */}
            <div className="hidden">
                {audioStream && <Audio stream={audioStream} />}
                {screenAudio && <Audio stream={screenAudio} />}
            </div>
        </>
    );
};

export default React.memo(RemotePeer);