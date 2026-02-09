import { useState } from 'react';
import { Calculator, TrendingUp, AlertCircle, TrendingDown, CheckCircle } from 'lucide-react';

export default function PricingCalculator({ minimal = false }) {
  // Load external pricing calculator instead of embedded component
  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        src="https://tinhgiaban.n8nvinhsatan.site/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '0px'
        }}
        title="Tính Giá Bán Chuyên Nghiệp"
        allowFullScreen
      />
    </div>
  );
}
    
    // Chi phí mềm (%)
    feePlatform: 15,
    feeTax: 1.5,
    feeReturn: 3.5,
    profitNet: 20,
  });

  const [platformType, setPlatformType] = useState('tikTok');

  // Điều chỉnh phí theo sàn
  const platformFees = {
    shopee: { name: 'Shopee', base: 18, extra: 'Hạn chế Freeship, Voucher cao' },
    tikTok: { name: 'TikTok Shop', base: 15, extra: 'Phí Marketing ít hơn' },
    lazada: { name: 'Lazada', base: 20, extra: 'Phí cao, Voucher bắt buộc' },
    retail: { name: 'Bán Lẻ Trực Tiếp', base: 5, extra: 'Không phí sàn, chỉ chi phí vận hành' },
  };

  // Tính toán
  const calculatePrice = (fees) => {
    const totalCost = inputs.costVon + inputs.costDong + inputs.costQua + inputs.costVan;
    const totalPercent = (fees.platform + inputs.feeTax + inputs.feeReturn + inputs.profitNet) / 100;
    const sellingPrice = totalCost / (1 - totalPercent);
    return { totalCost, sellingPrice, totalPercent };
  };

  // Tính cho từng sàn
  const results = {
    shopee: calculatePrice({ platform: platformFees.shopee.base }),
    tikTok: calculatePrice({ platform: platformFees.tikTok.base }),
    lazada: calculatePrice({ platform: platformFees.lazada.base }),
    retail: calculatePrice({ platform: platformFees.retail.base }),
  };

  const currentResult = results[platformType];
  const totalCost = inputs.costVon + inputs.costDong + inputs.costQua + inputs.costVan;

  // Phân tích chi phí
  const analyzePrice = (price) => {
    const selected = platformFees[platformType];
    const revenue = price;
    const platformFee = revenue * (selected.base / 100);
    const taxFee = revenue * (inputs.feeTax / 100);
    const returnFee = revenue * (inputs.feeReturn / 100);
    const actualProfit = revenue - totalCost - platformFee - taxFee - returnFee;
    const profitMargin = ((actualProfit / revenue) * 100).toFixed(1);

    return {
      revenue,
      platformFee,
      taxFee,
      returnFee,
      totalFees: platformFee + taxFee + returnFee,
      actualProfit,
      profitMargin,
    };
  };

  const analysis = analyzePrice(Math.round(currentResult.sellingPrice));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  // Phân tích lý do lời/lỗ chi tiết
  const analyzeReason = () => {
    const sellingPrice = Math.round(currentResult.sellingPrice);
    const selected = platformFees[platformType];
    const totalAllCosts = totalCost + 
      (sellingPrice * selected.base / 100) +
      (sellingPrice * inputs.feeTax / 100) +
      (sellingPrice * inputs.feeReturn / 100);
    
    const profit = sellingPrice - totalAllCosts;
    const profitRatio = profit / inputs.costVon;

    const reasons = {
      isProfit: profit > 0,
      totalProfit: profit,
      profitRatio,
      breakdown: {
        costVon: { label: 'Giá Vốn', value: inputs.costVon, percentage: (inputs.costVon / sellingPrice * 100) },
        costFixed: { label: 'Hộp/Bao Bì/Quà/Vận', value: inputs.costDong + inputs.costQua + inputs.costVan, percentage: ((inputs.costDong + inputs.costQua + inputs.costVan) / sellingPrice * 100) },
        platformFee: { label: `Phí ${selected.name}`, value: Math.round(sellingPrice * selected.base / 100), percentage: selected.base },
        taxFee: { label: 'Thuế & Hoàn', value: Math.round(sellingPrice * (inputs.feeTax + inputs.feeReturn) / 100), percentage: inputs.feeTax + inputs.feeReturn },
      },
      keyPoints: generateKeyPoints(profit, profitRatio, selected.base, inputs),
    };

    return reasons;
  };

  const generateKeyPoints = (profit, profitRatio, platformFee, inputs) => {
    const points = [];
    
    if (profit > 0) {
      points.push({
        type: 'success',
        text: `✅ Bạn sẽ LỜI ${Math.round(profit).toLocaleString()}đ trên mỗi sản phẩm`,
      });
      points.push({
        type: 'info',
        text: `Tức là lãi ${(profitRatio * 100).toFixed(1)}% so với vốn ban đầu`,
      });
    } else {
      points.push({
        type: 'error',
        text: `❌ Bạn sẽ LỖ ${Math.round(Math.abs(profit)).toLocaleString()}đ trên mỗi sản phẩm`,
      });
      points.push({
        type: 'error',
        text: `Tức là lỗ ${(Math.abs(profitRatio) * 100).toFixed(1)}% so với vốn`,
      });
    }

    if (platformFee > 20) {
      points.push({
        type: 'warning',
        text: `⚠️ Phí sàn ${platformFee}% rất cao - cân nhắc chuyển sang sàn khác`,
      });
    }

    if (inputs.profitNet < 15) {
      points.push({
        type: 'warning',
        text: `⚠️ Lãi ròng ${inputs.profitNet}% quá thấp - khó tăng trưởng kinh doanh`,
      });
    }

    if (inputs.costDong + inputs.costQua + inputs.costVan > inputs.costVon * 0.1) {
      points.push({
        type: 'info',
        text: `💡 Chi phí bao bì/quà/vận chiếm ${((inputs.costDong + inputs.costQua + inputs.costVan) / inputs.costVon * 100).toFixed(1)}% vốn - có thể tiết kiệm được`,
      });
    }

    return points;
  };

  const reason = analyzeReason();

  return (
    <div className="min-h-screen bg-gradient-to-br from-deepSlate-800 to-pricing-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-pricing-600 to-pricing-500 rounded-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-deepSlate-50">Tính Giá Bán Chuyên Nghiệp</h1>
          </div>
          <p className="text-emerald-500">
            Công thức của chuyên gia 30 năm - Không tự sát giá, bảo vệ lợi nhuận ròng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-2xl shadow-lg p-6 space-y-6 border border-deepSlate-700 dark:border-deepSlate-700">
              {/* Chi phí cứng */}
              <div>
                <h3 className="text-lg font-bold text-deepSlate-50 dark:text-deepSlate-100 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-deepSlate-8000 rounded-full"></span>
                  Chi Phí Cứng
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Giá Vốn (C_vốn)
                    </label>
                    <input
                      type="number"
                      name="costVon"
                      value={inputs.costVon}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 dark:bg-deepSlate-700 text-deepSlate-50 dark:text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Giá nhập từ xưởng/nhà cung cấp</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hộp/Bao Bì (C_đóng)
                    </label>
                    <input
                      type="number"
                      name="costDong"
                      value={inputs.costDong}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 dark:bg-deepSlate-700 text-deepSlate-50 dark:text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hộp, băng keo, màng co (3k-7k)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quà Tặng (C_quà)
                    </label>
                    <input
                      type="number"
                      name="costQua"
                      value={inputs.costQua}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 dark:bg-deepSlate-700 text-deepSlate-50 dark:text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quà kèm, Card cảm ơn (1k-2k)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vận Chuyển Nhập (C_vận)
                    </label>
                    <input
                      type="number"
                      name="costVan"
                      value={inputs.costVan}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-deepSlate-700 dark:border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 dark:bg-deepSlate-700 text-deepSlate-50 dark:text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chia đầu trên mỗi sản phẩm</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                  <p className="text-sm font-semibold text-error-900 dark:text-error-200">
                    Tổng Chi Phí Cứng: {(totalCost).toLocaleString()}đ
                  </p>
                </div>
              </div>

              {/* Chi phí mềm */}
              <div>
                <h3 className="text-lg font-bold text-deepSlate-50 dark:text-deepSlate-100 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Chi Phí Mềm (%)
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thuế & Hoàn (%)
                    </label>
                    <input
                      type="number"
                      name="feeTax"
                      value={inputs.feeTax}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-4 py-2 border border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mặc định 1.5% HKD (không đơn vị)- có thể cộng thêm %hoàn</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rủi Ro Hoàn/Hư (%)
                    </label>
                    <input
                      type="number"
                      name="feeReturn"
                      value={inputs.feeReturn}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-4 py-2 border border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Dự phòng rủi ro (3%-5%)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lợi Nhuận Ròng (%)
                    </label>
                    <input
                      type="number"
                      name="profitNet"
                      value={inputs.profitNet}
                      onChange={handleInputChange}
                      step="0.1"
                      className="w-full px-4 py-2 border border-deepSlate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-deepSlate-700 text-deepSlate-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tiền túi sau khi trừ hết (15%-25%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Selector */}
            <div className="bg-deepSlate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-deepSlate-50 mb-4">Chọn Sàn Bán Hàng</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(platformFees).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setPlatformType(key)}
                    className={`p-4 rounded-xl font-semibold transition-all ${
                      platformType === key
                        ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-bold">{value.name}</div>
                    <div className={`text-xs mt-1 ${platformType === key ? 'text-primary-100' : 'text-gray-600 dark:text-gray-400'}`}>
                      Phí: {value.base}%
                    </div>
                  </button>
                ))}
              </div>
            </div>



            {/* Main Price Display */}
            <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl shadow-lg p-8 text-white">
              <p className="text-lg font-semibold opacity-90 mb-2">Giá Niêm Yết Trên {platformFees[platformType].name}</p>
              <div className="text-5xl font-bold mb-4">
                {Math.round(currentResult.sellingPrice).toLocaleString()}đ
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-primary-100 text-sm">Lợi Nhuận Ròng</p>
                  <p className="text-2xl font-bold">{Math.round(inputs.costVon * inputs.profitNet / 100).toLocaleString()}đ</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-primary-100 text-sm">Tỷ Lệ Lãi</p>
                  <p className="text-2xl font-bold">{analysis.profitMargin}%</p>
                </div>
              </div>
            </div>

            {/* Chi Phí Breakdown */}
            <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-2xl shadow-lg p-6 border border-deepSlate-700 dark:border-deepSlate-700">
              <h3 className="text-lg font-bold text-deepSlate-50 dark:text-deepSlate-100 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary-600" />
                Phân Tích Chi Tiết
              </h3>

              <div className="space-y-4">
                {/* Doanh Thu */}
                <div className="flex justify-between items-center p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                  <span className="font-semibold text-deepSlate-50 dark:text-deepSlate-100">Doanh Thu (Giá Bán)</span>
                  <span className="text-xl font-bold text-success-600 dark:text-success-400">
                    {Math.round(analysis.revenue).toLocaleString()}đ
                  </span>
                </div>

                {/* Các Chi Phí */}
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 rounded-lg">
                    <span className="text-slate-100 dark:text-slate-200 font-medium">Giá Vốn</span>
                    <span className="font-semibold text-slate-100 dark:text-slate-50">-{inputs.costVon.toLocaleString()}đ</span>
                  </div>

                  <div className="flex justify-between p-3 bg-blue-900/30 dark:bg-blue-900/40 border border-blue-700 dark:border-blue-800 rounded-lg">
                    <span className="text-blue-200 dark:text-blue-300 font-medium">Hộp/Bao Bì/Quà/Vận Chuyển</span>
                    <span className="font-semibold text-blue-100 dark:text-blue-200">-{(inputs.costDong + inputs.costQua + inputs.costVan).toLocaleString()}đ</span>
                  </div>

                  <div className="flex justify-between p-3 bg-cyan-900/30 dark:bg-cyan-900/40 border border-cyan-700 dark:border-cyan-800 rounded-lg">
                    <span className="text-cyan-200 dark:text-cyan-300 font-medium">Phí {platformFees[platformType].name}</span>
                    <span className="font-semibold text-cyan-100 dark:text-cyan-200">-{Math.round(analysis.platformFee).toLocaleString()}đ ({platformFees[platformType].base}%)</span>
                  </div>

                  <div className="flex justify-between p-3 bg-indigo-900/30 dark:bg-indigo-900/40 border border-indigo-700 dark:border-indigo-800 rounded-lg">
                    <span className="text-indigo-200 dark:text-indigo-300 font-medium">Thuế & Hoàn</span>
                    <span className="font-semibold text-indigo-100 dark:text-indigo-200">-{Math.round(analysis.taxFee + analysis.returnFee).toLocaleString()}đ ({inputs.feeTax + inputs.feeReturn}%)</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t-2 border-gray-300 dark:border-gray-600 my-4"></div>

                  {/* Lợi Nhuận Ròng */}
                  <div className="flex justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg border-2 border-green-700 shadow-lg">
                    <span className="font-bold text-lg text-white">💰 Lợi Nhuận Ròng</span>
                    <span className="text-2xl font-bold text-green-100">
                      +{Math.round(analysis.actualProfit).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="mt-6 p-4 bg-amber-900/30 rounded-lg border border-amber-700 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-100">
                  <p className="font-semibold mb-1">⚠️ Lưu Ý Quan Trọng</p>
                  <p>
                    Đây là giá tối thiểu để bạn không lỗ. Nếu bán dưới mức này, bạn đang <strong>làm từ thiện</strong> cho sàn!
                  </p>
                </div>
              </div>

              {/* Tính Giá Bán Sỉ - Thu Gọn */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-lg p-4 text-white">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Giá Bán Sỉ (Buôn)
                  </h4>
                  <div className="space-y-2">
                    <p className="text-xs opacity-90">Công thức: Chi Phí Cứng ÷ (1 - 15%)</p>
                    <p className="text-2xl font-bold">{Math.round(totalCost / (1 - 0.15)).toLocaleString()}đ</p>
                    <p className="text-xs opacity-75">Tiết kiệm: {(Math.round(currentResult.sellingPrice) - Math.round(totalCost / (1 - 0.15))).toLocaleString()}đ</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
                  <h4 className="text-sm font-bold mb-3">⚡ Ưu Điểm Sỉ</h4>
                  <ul className="text-xs space-y-1 opacity-90">
                    <li>✅ Không phí sàn (tiết kiệm 15-20%)</li>
                    <li>✅ Không lo hoàn hàng phức tạp</li>
                    <li>✅ Thanh toán nhanh, lãi cao</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* So Sánh Các Sàn */}
            <div className="bg-deepSlate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-deepSlate-50 mb-6">📊 So Sánh Giá Trên Các Sàn</h3>
              
              <div className="space-y-3">
                {Object.entries(results).map(([key, result]) => {
                  const platform = platformFees[key];
                  const price = Math.round(result.sellingPrice);
                  const isSelected = platformType === key;
                  
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 border-2 border-purple-400'
                          : 'bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-bold ${isSelected ? 'text-purple-100' : 'text-slate-100'}`}>
                            {platform.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{platform.extra}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-deepSlate-50">
                            {price.toLocaleString()}đ
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Phí: {platform.base}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insights */}
              <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                <p className="font-semibold text-blue-300 mb-2">💡 Gợi Ý</p>
                <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong className="text-blue-300">TikTok</strong> có phí thấp nhất - ưu tiên bán tại đây</li>
                  <li><strong className="text-blue-300">Shopee</strong> phí cao hơn nhưng lưu lượng lớn</li>
                  <li><strong className="text-blue-300">Bán Lẻ Trực Tiếp</strong> giá rẻ nhất, lãi cao nhất</li>
                  <li>Luôn ghi nhớ: <strong className="text-amber-300">Giá thấp hơn = Thua lỗ</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Phân Tích Lý Do Lời/Lỗ */}
        <div className="mt-8">
          <div className={`rounded-2xl shadow-lg p-8 ${
            reason.isProfit 
              ? 'bg-deepSlate-800 border-2 border-emerald-500' 
              : 'bg-deepSlate-800 border-2 border-red-500'
          }`}>
            <div className="flex items-start gap-4 mb-6">
              {reason.isProfit ? (
                <div className="p-3 bg-emerald-600 rounded-full">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              ) : (
                <div className="p-3 bg-red-600 rounded-full">
                  <TrendingDown className="w-8 h-8 text-white" />
                </div>
              )}
              
              <div className="flex-1">
                <h2 className={`text-3xl font-bold mb-2 ${reason.isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {reason.isProfit ? '🎉 BẠN SẼ LỜI' : '⚠️ BẠN SẼ LỖ'}
                </h2>
                <p className={`text-2xl font-bold ${reason.isProfit ? 'text-emerald-300' : 'text-red-300'}`}>
                  {reason.isProfit ? '+' : '-'}{Math.abs(Math.round(reason.totalProfit)).toLocaleString()}đ / Sản Phẩm
                </p>
                <p className={`text-lg font-semibold mt-2 ${reason.isProfit ? 'text-emerald-100' : 'text-red-100'}`}>
                  Lãi ròng: {(reason.profitRatio * 100).toFixed(1)}% trên vốn {inputs.costVon.toLocaleString()}đ
                </p>
              </div>
            </div>

            {/* Chi Tiết Từng Khoản */}
            <div className="space-y-3 mb-6">
              {Object.entries(reason.breakdown).map(([key, item]) => {
                const percentage = typeof item.percentage === 'number' ? item.percentage : item.value / Math.round(currentResult.sellingPrice) * 100;
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-deepSlate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-deepSlate-50">{item.label}</p>
                      <p className="text-xs text-emerald-500">{percentage.toFixed(1)}% giá bán</p>
                    </div>
                    <p className="text-right">
                      <span className="text-lg font-bold text-deepSlate-50">{item.value.toLocaleString()}đ</span>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Các Lý Do Lời/Lỗ */}
            <div className="space-y-3">
              <h3 className="font-bold text-deepSlate-50 text-lg">🔍 Phân Tích Chi Tiết</h3>
              
              {reason.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    point.type === 'success'
                      ? 'bg-green-100 border-green-500 text-green-900'
                      : point.type === 'error'
                      ? 'bg-red-100 border-red-500 text-red-900'
                      : point.type === 'warning'
                      ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                      : 'bg-blue-100 border-blue-500 text-blue-900'
                  }`}
                >
                  <p className="font-semibold">{point.text}</p>
                </div>
              ))}
            </div>

            {/* Lời Khuyên Chuyên Nghiệp - Phân Tích Nền Kinh Tế 2026 */}
            <div className="mt-6 p-4 bg-deepSlate-800 rounded-lg border border-deepSlate-700">
              <h3 className="font-bold text-deepSlate-50 mb-4">💡 Lời Khuyên Chuyên Nghiệp - Nền Kinh Tế 2026</h3>
              
              {reason.isProfit ? (
                <>
                  {/* Phân tích theo tỷ lệ lãi */}
                  {reason.profitRatio > 0.30 ? (
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-green-900/30 border-l-4 border-green-500 rounded">
                        <p className="font-bold text-green-300 mb-1">🚀 CƠHỘI VÀNG - Lãi ròng {(reason.profitRatio * 100).toFixed(1)}%</p>
                        <p className="text-green-100">Bạn đang ở trong <strong>nhóm 20% doanh nghiệp thành công</strong> năm 2026</p>
                      </div>

                      <ul className="space-y-2 text-gray-300">
                        <li><strong className="text-emerald-400">📈 Chiến Lược 2026:</strong> Năm nay là năm vàng để scale-up. Tập trung mở rộng thị trường B2B</li>
                        <li><strong className="text-emerald-400">🎯 Mô Hình B2B Sỉ (Nên ưu tiên):</strong> Với lãi như vậy, bạn có thể chạy về giá sỉ thấp hơn 10-15% để tăng volume lớn. Lợi nhuận tuyệt đối sẽ cao hơn nhiều</li>
                        <li><strong className="text-emerald-400">🏪 Mô Hình Bán Lẻ Trực Tiếp:</strong> Duy trì giá cao này. Đây là channel lợi nhuận nhất. Tăng marketing lên 3-5% doanh thu để tăng conversion</li>
                        <li><strong className="text-emerald-400">📱 Mô Hình Sàn TMĐT (Shopee/TikTok):</strong> Khả thi nhưng không phải ưu tiên. Đây chỉ nên là outlet để tiêu hàng dư thừa hoặc test sản phẩm</li>
                        <li><strong className="text-emerald-400">💼 Tín Dụng Ngân Hàng:</strong> Lãi suất năm 2026 được dự báo 3-4%. Với lãi ròng {(reason.profitRatio * 100).toFixed(1)}%, bạn có thể vay vốn để scale-up mà vẫn có lãi ròng ổn định</li>
                      </ul>

                      <div className="mt-3 p-3 bg-blue-900/30 border-l-4 border-blue-500 rounded">
                        <p className="font-semibold text-blue-300">🌍 Bối Cảnh Kinh Tế 2026:</p>
                        <p className="text-blue-100 text-xs mt-1">Lạm phát ổn định (3-4%), tiêu dùng trực tuyến tăng 12-15%, các nhà bán lẻ vừa/nhỏ cần scaling nhanh. Đây là thời điểm vàng để bán B2B</p>
                      </div>
                    </div>
                  ) : reason.profitRatio > 0.15 ? (
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-yellow-900/30 border-l-4 border-yellow-500 rounded">
                        <p className="font-bold text-yellow-300 mb-1">⚠️ CẠNH TRANH KHỐC LIỆT - Lãi ròng {(reason.profitRatio * 100).toFixed(1)}%</p>
                        <p className="text-yellow-100">Bạn ở trong <strong>nhóm 60% doanh nghiệp bình thường</strong> năm 2026. Cần tối ưu hóa ngay</p>
                      </div>

                      <ul className="space-y-2 text-gray-300">
                        <li><strong className="text-amber-400">⚡ Chiến Lược 2026:</strong> Cạnh tranh qua volume, không phải giá. Tăng doanh số từ 2-3 sản phẩm/tuần lên 10-15 sản phẩm/tuần</li>
                        <li><strong className="text-amber-400">🛍️ Ưu Tiên Sàn TMĐT Cao Lưu Lượng:</strong> TikTok Shop (phí 15%) hiệu quả hơn Shopee (phí 18%) hiện nay. Tập trung vào TikTok + livestream</li>
                        <li><strong className="text-amber-400">💰 Giảm Chi Phí Không Cần Thiết:</strong> Giảm bao bì/quà tặng từ {(inputs.costDong + inputs.costQua + inputs.costVan).toLocaleString()}đ xuống có thể tiết kiệm 20-30%</li>
                        <li><strong className="text-amber-400">🤝 Mô Hình Dropship/Reseller:</strong> Khó bán trực tiếp? Tìm 20-30 reseller bán hộ với margin 10-15%. Doanh số tăng 5x mà chi phí quảng cáo 0</li>
                        <li><strong className="text-amber-400">📊 Kiến Thức 2026:</strong> Kinh tế VN sẽ tăng 6-6.5%, nhưng cạnh tranh rất khốc liệt. Không thể sống bằng một mô hình duy nhất</li>
                      </ul>

                      <div className="mt-3 p-3 bg-orange-900/30 border-l-4 border-orange-500 rounded">
                        <p className="font-semibold text-orange-300">💡 Kiến Nghị:</p>
                        <p className="text-orange-100 text-xs mt-1">Kết hợp 3 kênh: Sàn TMĐT (60%), B2B/Reseller (30%), Bán Lẻ Trực Tiếp (10%). Điều này sẽ tối ưu lãi ròng tổng thể</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-red-900/30 border-l-4 border-red-500 rounded">
                        <p className="font-bold text-red-300 mb-1">⚠️ NGƯỠNG NGUY HIỂM - Lãi ròng {(reason.profitRatio * 100).toFixed(1)}%</p>
                        <p className="text-red-100">Bạn đang bán <strong>gần break-even</strong>. Năm 2026, chỉ một cú sốc nhỏ cũng có thể phá sản</p>
                      </div>

                      <ul className="space-y-2 text-gray-300">
                        <li><strong className="text-red-400">🚨 Tình Hình Khẩn Cấp:</strong> Một chút lạm phát (5-6%) hoặc tăng phí sàn có thể khiến bạn lỗ. Không nên tiếp tục với mô hình này</li>
                        <li><strong className="text-red-400">🔄 Hành Động Ngay:</strong> (1) Tăng giá bán lên 8-12%, (2) Giảm chi phí vốn bằng cách nhập lại nhà cung cấp khác, (3) Hoặc chuyển sang sản phẩm khác</li>
                        <li><strong className="text-red-400">🎯 Mô Hình Nào Khả Thi:</strong> Chỉ nên bán B2B (sỉ/đại lý) hoặc bán lẻ trực tiếp có giá cao. Sàn TMĐT sẽ khiến lỗ</li>
                        <li><strong className="text-red-400">💼 Vay Tiền Để Scale:</strong> <strong>KHÔNG NÊN</strong>. Lãi suất ngân hàng (3-4%) đã cao hơn lãi ròng của bạn rồi</li>
                        <li><strong className="text-red-400">📉 Kinh Tế 2026:</strong> Tỷ giá có thể biến động, lạm phát có thể tăng. Chỉ những doanh nghiệp có margin ≥15% mới an toàn</li>
                      </ul>

                      <div className="mt-3 p-3 bg-red-900/40 border-l-4 border-red-600 rounded">
                        <p className="font-semibold text-red-300">❌ Khuyến Cáo Mạnh:</p>
                        <p className="text-red-100 text-xs mt-1">Đừng tiếp tục với sản phẩm/chiến lược này. Năm 2026 không phù hợp cho những doanh nghiệp margin thấp. Hãy tìm sản phẩm mới hoặc pivot mô hình kinh doanh</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-red-900/30 border-l-4 border-red-600 rounded">
                    <p className="font-bold text-red-300 mb-1">❌ THUA LỖ - {Math.abs(Math.round(reason.totalProfit)).toLocaleString()}đ/SP</p>
                    <p className="text-red-100"><strong>KHÔNG NÊN BÁN</strong> ở giá này trong bất kỳ mô hình nào</p>
                  </div>

                  <ul className="space-y-2 text-gray-300">
                    <li><strong className="text-red-400">🔴 Tình Hình:</strong> Bạn đang mất tiền trên mỗi sản phẩm. Đây là chiến lược tự sát trong năm 2026 khi chi phí đang tăng</li>
                    <li><strong className="text-red-400">💰 Hành Động Khẩn Cấp:</strong> Tăng giá ngay lập tức hoặc ngưng bán sản phẩm này</li>
                    <li><strong className="text-red-400">📊 Phân Tích Nguyên Nhân:</strong> Chi phí vốn quá cao ({inputs.costVon.toLocaleString()}đ)? Hay phí sàn quá cao ({platformFees[platformType].base}%)? Hay cả hai?</li>
                    <li><strong className="text-red-400">🎯 Giải Pháp:</strong> (1) Tìm nhà cung cấp rẻ hơn, (2) Bán B2B/sỉ thay vì sàn TMĐT, (3) Bán sản phẩm khác</li>
                    <li><strong className="text-red-400">⚠️ 2026 Cảnh Báo:</strong> Lạm phát + tăng phí sàn = bạn sẽ lỗ tệ hơn. Cần thay đổi chiến lược ngay</li>
                  </ul>

                  <div className="mt-3 p-3 bg-red-900/40 border-l-4 border-red-600 rounded">
                    <p className="font-semibold text-red-300">⛔ Kết Luận:</p>
                    <p className="text-red-100 text-xs mt-1">Không bao giờ bán ở giá có lỗ. Ngay cả khi bạn cần tăng doanh số, bán lỗ cũng không giải quyết được. Chỉ làm lỗ thêm</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Công Thức Tính */}
        <div className="mt-8 bg-deepSlate-800 rounded-2xl shadow-lg p-6 text-emerald-500">
          <h3 className="font-bold text-deepSlate-50 mb-3">📝 Công Thức Tính</h3>
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p>P = (C_vốn + C_đóng + C_quà + C_vận) / (1 - (%Phí_Sàn + %Thuế + %Hoàn + %Lãi_Ròng))</p>
          </div>
          <p className="text-sm mt-4">
            ✅ Công cụ này giúp bạn tính giá <strong>không tự sát</strong>, bảo vệ lợi nhuận ròng thực tế.
          </p>
        </div>
      </div>
    </div>
  );
}
