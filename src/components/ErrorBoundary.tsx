import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Taj POS Error Boundary caught:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('taj_pos_user');
      localStorage.removeItem('taj_pos_shop');
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-800">
              سسٹم میں غیر متوقع مسئلہ پیش آیا ہے
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              براہ کرم ایپ کو دوبارہ لوڈ کریں یا سیشن ری سیٹ کر کے لاگ ان کریں۔ آپ کا محفوظ شدہ ڈیٹا ضائع نہیں ہوگا۔
            </p>
            {this.state.error && (
              <div className="mb-4 p-2.5 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>صفحہ دوبارہ لوڈ کریں</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                سیشن ری سیٹ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
