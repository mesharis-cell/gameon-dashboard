"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Loader2,
  FileText,
} from "lucide-react";

interface PdfViewerEnhancedProps {
  pdfUrl: string | null;
  isLoading?: boolean;
}

export const PdfViewerEnhanced: React.FC<PdfViewerEnhancedProps> = ({
  pdfUrl,
  isLoading = false,
}) => {
  const [scale, setScale] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 10, 50));
  };

  const handleFullscreen = async () => {
    if (!viewerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await viewerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  const handlePercentageChange = (percentage: number) => {
    setScale(percentage);
  };

  if (isLoading || !pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
          <div>
            <p className="text-lg font-medium">Loading PDF...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  // Construct PDF URL with zoom parameter and hide toolbar
  const pdfUrlWithZoom = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=${scale}`;

  return (
    <div
      ref={viewerRef}
      className={`flex flex-col h-full ${
        isFullscreen ? "bg-background p-4" : ""
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 px-2 py-2 bg-background border rounded-2xl">
        <div className="flex items-center gap-2 bg-primary/10 p-2 text-primary rounded-lg">
          <FileText className="h-4 w-4" />
          <span className=" text-sm">PDF Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 50}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <select
            value={scale}
            onChange={(e) => handlePercentageChange(Number(e.target.value))}
            className="h-8 px-2 text-sm border rounded bg-background"
          >
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="85">85%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 200}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* PDF Display using iframe with zoom */}
      <div className="flex-1 overflow-hidden rounded-2xl border bg-gray-100 dark:bg-gray-900">
        <iframe
          ref={iframeRef}
          src={pdfUrlWithZoom}
          className="w-full h-full border-0"
          title="PDF Preview"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: "top left",
            width: `${10000 / scale}%`,
            height: `${10000 / scale}%`,
          }}
        />
      </div>
    </div>
  );
};
