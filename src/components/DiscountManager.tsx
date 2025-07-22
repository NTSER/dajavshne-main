import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Percent, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Discount {
  id: string;
  discount_type: 'percentage' | 'bulk_deal' | 'time_based';
  discount_value: number;
  buy_quantity?: number | null;
  get_quantity?: number | null;
  valid_days?: string[] | null;
  valid_start_time?: string | null;
  valid_end_time?: string | null;
  title: string;
  description?: string | null;
  active: boolean;
}

interface DiscountManagerProps {
  venueId: string;
  defaultDiscount: number;
  onDefaultDiscountChange: (value: number) => void;
}

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const DiscountManager = ({ venueId, defaultDiscount, onDefaultDiscountChange }: DiscountManagerProps) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<{
    discount_type: 'percentage' | 'bulk_deal' | 'time_based';
    discount_value: number;
    buy_quantity: number;
    get_quantity: number;
    valid_days: string[];
    valid_start_time: string;
    valid_end_time: string;
    title: string;
    description: string;
    active: boolean;
  }>({
    discount_type: 'percentage',
    discount_value: 0,
    buy_quantity: 2,
    get_quantity: 1,
    valid_days: [],
    valid_start_time: '09:00',
    valid_end_time: '17:00',
    title: '',
    description: '',
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    if (venueId) {
      fetchDiscounts();
    }
  }, [venueId]);

  const fetchDiscounts = async () => {
    const { data, error } = await supabase
      .from('venue_discounts')
      .select('*')
      .eq('venue_id', venueId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch discounts",
        variant: "destructive"
      });
    } else {
      setDiscounts((data || []) as Discount[]);
    }
  };

  const handleSaveDiscount = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a discount title",
        variant: "destructive"
      });
      return;
    }

    const discountData = {
      venue_id: venueId,
      ...formData,
      valid_days: formData.discount_type === 'time_based' ? formData.valid_days : null,
      valid_start_time: formData.discount_type === 'time_based' ? formData.valid_start_time : null,
      valid_end_time: formData.discount_type === 'time_based' ? formData.valid_end_time : null,
      buy_quantity: formData.discount_type === 'bulk_deal' ? formData.buy_quantity : null,
      get_quantity: formData.discount_type === 'bulk_deal' ? formData.get_quantity : null
    };

    let result;
    if (editingDiscount) {
      result = await supabase
        .from('venue_discounts')
        .update(discountData)
        .eq('id', editingDiscount.id);
    } else {
      result = await supabase
        .from('venue_discounts')
        .insert([discountData]);
    }

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to save discount",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Discount ${editingDiscount ? 'updated' : 'created'} successfully`
      });
      fetchDiscounts();
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    const { error } = await supabase
      .from('venue_discounts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Discount deleted successfully"
      });
      fetchDiscounts();
    }
  };

  const resetForm = () => {
    setFormData({
      discount_type: 'percentage',
      discount_value: 0,
      buy_quantity: 2,
      get_quantity: 1,
      valid_days: [],
      valid_start_time: '09:00',
      valid_end_time: '17:00',
      title: '',
      description: '',
      active: true
    });
    setEditingDiscount(null);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      buy_quantity: discount.buy_quantity || 2,
      get_quantity: discount.get_quantity || 1,
      valid_days: discount.valid_days || [],
      valid_start_time: discount.valid_start_time || '09:00',
      valid_end_time: discount.valid_end_time || '17:00',
      title: discount.title,
      description: discount.description || '',
      active: discount.active
    });
    setIsDialogOpen(true);
  };

  const toggleDaySelection = (day: string) => {
    setFormData(prev => ({
      ...prev,
      valid_days: prev.valid_days.includes(day)
        ? prev.valid_days.filter(d => d !== day)
        : [...prev.valid_days, day]
    }));
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'time_based': return <Clock className="h-4 w-4" />;
      case 'bulk_deal': return <Gift className="h-4 w-4" />;
      default: return <Percent className="h-4 w-4" />;
    }
  };

  const getDiscountLabel = (discount: Discount) => {
    switch (discount.discount_type) {
      case 'percentage':
        return `${discount.discount_value}% off`;
      case 'time_based':
        return `${discount.discount_value}% off during specific hours`;
      case 'bulk_deal':
        return `Buy ${discount.buy_quantity} get ${discount.get_quantity} free`;
      default:
        return discount.title;
    }
  };

  return (
    <div className="space-y-6">
      {/* Default Discount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Default Discount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="defaultDiscount">Default discount percentage (%)</Label>
            <Input
              id="defaultDiscount"
              type="number"
              min="0"
              max="100"
              value={defaultDiscount}
              onChange={(e) => onDefaultDiscountChange(Number(e.target.value))}
              placeholder="0"
            />
            <p className="text-sm text-muted-foreground">
              This discount will be applied to all services by default
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Special Discounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Special Discounts</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discount
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Happy Hour Discount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountType">Discount Type</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, discount_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage Discount</SelectItem>
                          <SelectItem value="time_based">Time-based Discount</SelectItem>
                          <SelectItem value="bulk_deal">Bulk Deal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.discount_type === 'percentage' && (
                    <div>
                      <Label htmlFor="discountValue">Discount Percentage (%)</Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                      />
                    </div>
                  )}

                  {formData.discount_type === 'time_based' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="discountValue">Discount Percentage (%)</Label>
                        <Input
                          id="discountValue"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discount_value}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount_value: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label>Valid Days</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {DAYS_OF_WEEK.map(day => (
                            <Badge
                              key={day}
                              variant={formData.valid_days.includes(day) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleDaySelection(day)}
                            >
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={formData.valid_start_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, valid_start_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime">End Time</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={formData.valid_end_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, valid_end_time: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.discount_type === 'bulk_deal' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="buyQuantity">Buy Quantity</Label>
                        <Input
                          id="buyQuantity"
                          type="number"
                          min="1"
                          value={formData.buy_quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, buy_quantity: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="getQuantity">Get Free</Label>
                        <Input
                          id="getQuantity"
                          type="number"
                          min="1"
                          value={formData.get_quantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, get_quantity: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about this discount..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveDiscount}>
                      {editingDiscount ? 'Update' : 'Create'} Discount
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {discounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No special discounts configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {discounts.map((discount) => (
                <div key={discount.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getDiscountIcon(discount.discount_type)}
                    <div>
                      <h4 className="font-medium">{discount.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getDiscountLabel(discount)}
                      </p>
                      {discount.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {discount.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={discount.active ? "default" : "secondary"}>
                      {discount.active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(discount)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDiscount(discount.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};