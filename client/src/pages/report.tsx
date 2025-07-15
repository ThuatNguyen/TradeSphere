import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { AlertTriangle, Upload, Send, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { insertReportSchema } from "@shared/schema";

const reportFormSchema = insertReportSchema.extend({
  amount: z.number().min(1, "Số tiền phải lớn hơn 0"),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

export default function ReportPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnonymous, setIsAnonymous] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      accusedName: "",
      phoneNumber: "",
      accountNumber: "",
      bank: "",
      amount: 0,
      description: "",
      isAnonymous: false,
      reporterName: "",
      reporterPhone: "",
    },
  });

  const createReportMutation = useMutation({
    mutationFn: api.createReport,
    onSuccess: (data) => {
      toast({
        title: "Tố cáo thành công",
        description: "Cảm ơn bạn đã gửi tố cáo. Chúng tôi sẽ xem xét trong 24h.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/recent"] });
      setLocation(`/detail/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi gửi tố cáo. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    const submitData = {
      ...data,
      isAnonymous,
      reporterName: isAnonymous ? undefined : data.reporterName,
      reporterPhone: isAnonymous ? undefined : data.reporterPhone,
    };
    createReportMutation.mutate(submitData);
  };

  const banks = [
    { value: "vietcombank", label: "Vietcombank" },
    { value: "techcombank", label: "Techcombank" },
    { value: "bidv", label: "BIDV" },
    { value: "vietinbank", label: "VietinBank" },
    { value: "acb", label: "ACB" },
    { value: "mbbank", label: "MB Bank" },
    { value: "other", label: "Khác" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Tố cáo lừa đảo
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Chia sẻ thông tin để bảo vệ cộng đồng khỏi những kẻ lừa đảo. Thông tin của bạn sẽ được bảo mật.
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="accusedName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên người lừa đảo <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên hoặc biệt danh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: 0123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tài khoản ngân hàng</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập số tài khoản" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngân hàng</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn ngân hàng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.value} value={bank.value}>
                              {bank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền bị chiếm đoạt (VNĐ) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ví dụ: 5000000" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả vụ việc <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={5}
                        placeholder="Mô tả chi tiết cách thức lừa đảo, thời gian, địa điểm và các thông tin liên quan..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload Placeholder */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đính kèm ảnh biên lai/chứng từ
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-primary transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-800">
                        <span>Tải lên tệp</span>
                        <input type="file" className="sr-only" accept="image/*" />
                      </label>
                      <p className="pl-1">hoặc kéo thả</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, JPEG lên đến 10MB</p>
                  </div>
                </div>
              </div>

              {/* Reporter Information */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  Thông tin người tố cáo (tùy chọn)
                </h3>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isAnonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <label htmlFor="isAnonymous" className="text-sm text-slate-700">
                      Tố cáo ẩn danh (không hiển thị thông tin của tôi)
                    </label>
                  </div>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="reporterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên của bạn</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tên của bạn" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="reporterPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại của bạn</FormLabel>
                          <FormControl>
                            <Input placeholder="Để liên hệ xác minh nếu cần" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center text-sm text-slate-600">
                  <Info className="h-4 w-4 mr-2" />
                  Thông tin sẽ được xem xét và xử lý trong 24h
                </div>
                <Button 
                  type="submit" 
                  disabled={createReportMutation.isPending}
                  className="px-8"
                >
                  {createReportMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Gửi tố cáo
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
