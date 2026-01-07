import { useState } from 'react';
import { KIBANA_URL, KIBANA_DISCOVER_PATH } from '@/utils/constants';
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KibanaEmbedProps {
  path?: string;
  title?: string;
}

export function KibanaEmbed({ path = KIBANA_DISCOVER_PATH, title = 'Kibana Discover' }: KibanaEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  const kibanaUrl = `${KIBANA_URL}${path}?embed=true`;

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div
      className={cn(
        "glass-card overflow-hidden transition-all duration-300",
        isFullscreen && "fixed inset-4 z-50"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
          <a
            href={`${KIBANA_URL}${path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: isFullscreen ? 'calc(100% - 60px)' : '500px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading Kibana...</span>
            </div>
          </div>
        )}
        <iframe
          key={key}
          src={kibanaUrl}
          className="w-full h-full border-0"
          title={title}
          onLoad={handleLoad}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
}

export default KibanaEmbed;
