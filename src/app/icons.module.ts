import { NgModule } from '@angular/core';
import {
    LucideAngularModule,
    Upload, FileText, Play, Plus, Trash2, File, Loader2, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, Sparkles, X, ChevronRight, Download,
    ChevronUp, ChevronDown, GripVertical, ArrowUp, ArrowDown, ArrowLeft, SkipForward, Activity, Info,
    Bold, Italic, Underline, List, ListOrdered, RemoveFormatting,
    Mail, Phone, MapPin, Globe, Linkedin, Calendar, Briefcase, GraduationCap, Wrench, User, Star,
    Target, Check, ListPlus, Eye, Sun, Moon, Settings, LayoutTemplate, Palette, Save, Home, CheckSquare,
    FileType, FileJson, Pin, PinOff, Clock, History, Menu, ChevronLeft, Search, PlusCircle,
    Music, Languages, Zap, Trophy, Edit2, Edit3, Car, TrendingUp, Heart, Camera, RotateCcw, LayoutDashboard,
    AlertCircle, DollarSign, ExternalLink, PenTool
} from 'lucide-angular';

@NgModule({
    imports: [
        LucideAngularModule.pick({
            Upload, FileText, Play, Plus, Trash2, File, Loader2, RefreshCw, CheckCircle, AlertTriangle, ArrowRight, Sparkles, X, ChevronRight, Download,
            ChevronUp, ChevronDown, GripVertical, ArrowUp, ArrowDown, ArrowLeft, SkipForward, Activity, Info,
            Bold, Italic, Underline, List, ListOrdered, RemoveFormatting,
            Mail, Phone, MapPin, Globe, Linkedin, Calendar, Briefcase, GraduationCap, Wrench, User, Star,
            Target, Check, ListPlus, Eye, Sun, Moon, Settings, LayoutTemplate, Palette, Save, Home, CheckSquare,
            FileType, FileJson, Pin, PinOff, Clock, History, Menu, ChevronLeft, Search, PlusCircle,
            Music, Languages, Zap, Trophy, Edit2, Edit3, Car, TrendingUp, Heart, Camera, RotateCcw, LayoutDashboard,
            AlertCircle, DollarSign, ExternalLink, PenTool
        })
    ],
    exports: [LucideAngularModule]
})
export class IconsModule { }
