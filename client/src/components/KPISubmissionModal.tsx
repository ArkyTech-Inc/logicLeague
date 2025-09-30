import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import type { ActualSubmission } from '@/types';

const submissionSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  kpiId: z.string().min(1, 'KPI is required'),
  targetId: z.string().min(1, 'Target is required'),
  actualValue: z.string().min(1, 'Actual value is required'),
  comments: z.string().optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface KPISubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KPISubmissionModal({ isOpen, onClose }: KPISubmissionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      departmentId: '',
      kpiId: '',
      targetId: '',
      actualValue: '',
      comments: '',
    },
  });

  const watchedDepartmentId = form.watch('departmentId');
  const watchedKpiId = form.watch('kpiId');

  // Get departments
  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: isOpen,
  });

  // Get KPIs for selected department
  const { data: kpis } = useQuery({
    queryKey: ['/api/kpis', watchedDepartmentId],
    queryFn: () => apiClient.getKPIs(watchedDepartmentId),
    enabled: isOpen && !!watchedDepartmentId,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (data: ActualSubmission) => apiClient.submitActual(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'KPI data submitted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/actuals'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit KPI data',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedFiles([]);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: SubmissionFormData) => {
    const submission: ActualSubmission = {
      kpiId: data.kpiId,
      targetId: data.targetId,
      actualValue: data.actualValue,
      comments: data.comments,
      evidenceFiles: selectedFiles,
    };

    submitMutation.mutate(submission);
  };

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-kpi-submission">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Submit KPI Data
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.code} - {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kpiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KPI</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-set target if available
                        const selectedKPI = kpis?.find(k => k.id === value);
                        if (selectedKPI?.currentTarget) {
                          form.setValue('targetId', selectedKPI.currentTarget.id);
                        }
                      }} 
                      value={field.value}
                      disabled={!watchedDepartmentId}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-kpi">
                          <SelectValue placeholder="Select KPI" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kpis?.map((kpi) => (
                          <SelectItem key={kpi.id} value={kpi.id}>
                            {kpi.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="actualValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter actual value"
                        {...field}
                        data-testid="input-actual-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Target Value</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    watchedKpiId && kpis
                      ? kpis.find(k => k.id === watchedKpiId)?.currentTarget?.targetValue || ''
                      : ''
                  }
                  disabled
                  className="bg-muted"
                  data-testid="input-target-value"
                />
              </FormItem>

              <FormItem>
                <FormLabel>Period</FormLabel>
                <Input
                  value={`Q${currentQuarter} ${currentYear}`}
                  disabled
                  className="bg-muted"
                  data-testid="input-period"
                />
              </FormItem>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-4">
              <Label>Evidence Upload</Label>
              <Card className="border-dashed border-2 border-border">
                <div className="p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground mb-2">
                    Drag & drop files here or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    data-testid="button-browse-files"
                  >
                    Browse Files
                  </Button>
                </div>
              </Card>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files:</Label>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Additional context or notes..."
                      {...field}
                      data-testid="textarea-comments"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit KPI Data'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
