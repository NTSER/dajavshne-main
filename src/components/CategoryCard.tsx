
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

interface CategoryCardProps {
  category: Category;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const Icon = category.icon;
  
  return (
    <Link to={`/category/${category.id}`}>
      <Card className="hover-lift cursor-pointer group border-white/10 bg-card/50 hover:bg-card/70 transition-all duration-300">
        <CardContent className="p-6 text-center">
          <div 
            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-1 text-sm sm:text-base">{category.name}</h3>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
