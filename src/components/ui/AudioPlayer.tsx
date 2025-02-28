import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioSrc: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 shadow-sm">
      <audio
        ref={audioRef}
        src={audioSrc}
        onEnded={handleEnded}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isPlaying
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-4 h-4" />
            <span>Pausar</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Ouvir Explicação</span>
          </>
        )}
      </button>
      <Volume2 className="w-5 h-5 text-blue-600" />
    </div>
  );
};
