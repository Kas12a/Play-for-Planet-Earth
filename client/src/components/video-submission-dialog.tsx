import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Video, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";

interface VideoSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questId: string;
  questTitle: string;
  codeWord?: string;
  accessToken?: string;
  onSuccess?: (videoPath: string) => void;
}

export function VideoSubmissionDialog({
  open,
  onOpenChange,
  questId,
  questTitle,
  codeWord = "PLANET",
  accessToken,
  onSuccess,
}: VideoSubmissionDialogProps) {
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setUploadedPath(response.objectPath);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be under 100MB.",
          variant: "destructive",
        });
        return;
      }
      setVideoFile(file);
      setUploadedPath(null);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    await uploadFile(videoFile);
  };

  const handleSubmit = async () => {
    if (!uploadedPath) {
      toast({
        title: "Video required",
        description: "Please upload your video first.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const response = await fetch(`/api/quests/${questId}/submit-video`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          videoPath: uploadedPath,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit video");
      }

      toast({
        title: "Video submitted!",
        description: "Your video has been submitted for verification.",
      });

      onSuccess?.(uploadedPath);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setNotes("");
    setUploadedPath(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            Submit Video Proof
          </DialogTitle>
          <DialogDescription>
            Upload your video for "{questTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-yellow-500 text-sm">Today's Code Word</span>
            </div>
            <p className="text-lg font-bold">{codeWord}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Say this word in your video for verification
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Video File</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isUploading || submitting}
                data-testid="input-video-file"
              />
            </div>
            {videoFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          {videoFile && !uploadedPath && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
              data-testid="button-upload-video"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading... {progress}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          )}

          {uploadedPath && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500 font-medium">Video uploaded successfully</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context about your video..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              data-testid="textarea-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!uploadedPath || submitting}
            data-testid="button-submit-video"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Verification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
