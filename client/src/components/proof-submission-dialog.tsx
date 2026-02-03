import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Video, Image, Camera, Loader2, CheckCircle, AlertCircle, X, Shield } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Quest } from "@/lib/store";
import { TodaysCodeDisplay } from "./todays-code-display";

interface ProofSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: Quest | null;
  accessToken?: string;
  onSuccess?: () => void;
}

export function ProofSubmissionDialog({
  open,
  onOpenChange,
  quest,
  accessToken,
  onSuccess,
}: ProofSubmissionDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading, progress, error: uploadError } = useUpload();

  const isVideo = quest?.verification_type === 'proof_video';
  const isPhoto = quest?.verification_type === 'proof_photo';
  const isScreenshot = quest?.verification_type === 'screenshot_health';
  
  const acceptTypes = isVideo 
    ? "video/*" 
    : "image/*";

  const getTypeLabel = () => {
    if (isVideo) return "Video";
    if (isPhoto) return "Photo";
    if (isScreenshot) return "Screenshot";
    return "Proof";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedPath(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const response = await uploadFile(file);
      if (response?.objectPath) {
        setUploadedPath(response.objectPath);
        toast({
          title: "Upload complete",
          description: `${getTypeLabel()} uploaded successfully.`,
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!quest || !accessToken || !uploadedPath) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/quests/${quest.id}/submit-proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          proofPath: uploadedPath,
          proofType: quest.verification_type,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit proof");
      }

      toast({
        title: "Proof submitted!",
        description: "Your submission is pending review.",
      });

      onSuccess?.();
      handleClose();
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

  const handleClose = () => {
    setFile(null);
    setNotes("");
    setUploadedPath(null);
    onOpenChange(false);
  };

  const removeFile = () => {
    setFile(null);
    setUploadedPath(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit {getTypeLabel()} Proof</DialogTitle>
          <DialogDescription>{quest?.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {quest?.anti_cheat_requires_daily_code && (
            <TodaysCodeDisplay />
          )}

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {quest?.proof_instructions}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Upload {getTypeLabel()}</Label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              onChange={handleFileSelect}
              className="hidden"
              capture={isVideo ? "environment" : undefined}
            />

            {!file ? (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  {isVideo ? (
                    <Video className="w-10 h-10 text-muted-foreground" />
                  ) : (
                    <Image className="w-10 h-10 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Click to upload {getTypeLabel().toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      or drag and drop
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative border rounded-lg p-4">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removeFile}
                >
                  <X className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-3">
                  {isVideo ? (
                    <Video className="w-8 h-8 text-primary" />
                  ) : (
                    <Image className="w-8 h-8 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  {uploadedPath ? (
                    <Badge className="bg-green-500 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </Badge>
                  ) : isUploading ? (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {progress}%
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={handleUpload}>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {uploadError.message}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!uploadedPath || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Proof"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
