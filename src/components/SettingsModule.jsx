import { useState } from "react";
import { Plus, Trash2, Edit2, X, BookOpen, Info, RotateCcw, Palette, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getThemeList } from "@/themes/colorSchemes.js";

export default function SettingsModule({
  categories,
  onAddCategory,
  onDeleteCategory,
  onResetData,
}) {
  const { verifyPassword } = useAuth();
  const { currentTheme, switchTheme, refreshPage } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryType, setCategoryType] = useState("income");
  const [categoryName, setCategoryName] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetVerifying, setResetVerifying] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddCategory = () => {
    if (!categoryName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }

    onAddCategory({
      name: categoryName,
      type: categoryType,
    });

    setCategoryName("");
    setShowAddModal(false);
  };

  const handleDelete = (id, type) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) {
      return;
    }
    onDeleteCategory(id, type);
  };

  const [showGuide, setShowGuide] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const handleResetData = async (skipPasswordCheck = false) => {
    if (!skipPasswordCheck && !resetPassword.trim()) {
      setResetError("Vui lòng nhập mật khẩu đăng nhập để xác nhận.");
      return;
    }
    setResetVerifying(true);
    setResetError("");
    let result = { success: false };
    if (!skipPasswordCheck) {
      result = await verifyPassword(resetPassword);
    } else {
      result = { success: true };
    }
    setResetVerifying(false);
    if (result.success && onResetData) {
      onResetData("full");
      setResetPassword("");
      setResetError("");
      setShowResetModal(false);
      alert("✅ Đã xóa toàn bộ dữ liệu. Chỉ giữ lại tài khoản đăng nhập.");
    } else {
      setResetError(result.error || "Mật khẩu không đúng.");
    }
  };

  const handleResetWithoutApi = () => {
    if (!window.confirm(
      "API không phản hồi. Bạn có chắc muốn xóa dữ liệu CHỈ trên thiết bị này (localStorage)? Server sẽ KHÔNG được cập nhật. Sau khi API hoạt động lại, dữ liệu trên server có thể ghi đè. Tiếp tục?"
    )) return;
    handleResetData(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetPassword("");
    setResetError("");
  };

  return (
    <div className="p-6 bg-gradient-to-b from-deepSlate-800 to-white dark:from-gray-800 dark:to-gray-900 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
              Cấu hình
            </h1>
            <p className="text-emerald-500 text-deepSlate-300 mt-1">
              Quản lý danh mục thu chi và hướng dẫn sử dụng
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BookOpen size={20} />
              <span>{showGuide ? 'Ẩn' : 'Xem'} Hướng Dẫn</span>
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              title="Xóa toàn bộ dữ liệu, chỉ giữ tài khoản"
            >
              <RotateCcw size={20} />
              <span>Xóa toàn bộ dữ liệu</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Thêm danh mục</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hướng Dẫn Chi Tiết */}
      {showGuide && (
        <div className="mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center mb-4">
            <Info size={24} className="text-purple-600 dark:text-purple-400 mr-2" />
            <h2 className="text-2xl font-bold text-deepSlate-50 dark:text-deepSlate-100">
              Hướng Dẫn Sử Dụng Ứng Dụng
            </h2>
          </div>

          <div className="space-y-6">
            {/* Tổng quan */}
            <div>
              <h3 className="text-lg font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-3">
                1. Tổng quan Quỹ
              </h3>
              <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-deepSlate-300 mb-3">
                  <strong>Đây là nơi bạn xem tổng quan về tiền của mình:</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">💰 Tiền mặt & Ngân hàng</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Hiển thị số tiền bạn có trong ví tiền mặt và tài khoản ngân hàng. 
                      Nếu số tiền thực tế khác với số tiền trên màn hình, bạn có thể nhấn nút "So khớp" để điều chỉnh cho đúng.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">📦 Tiền Hàng</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Đây là giá trị hàng hóa bạn đang có trong kho (tính theo giá vốn). 
                      Ví dụ: Nếu bạn có 10 sản phẩm, mỗi sản phẩm giá vốn 50,000₫ thì Tiền Hàng = 500,000₫.
                      Nhấn vào ô này để kiểm tra và điều chỉnh số lượng hàng thực tế trong kho.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">⏳ Số tiền tạm đoán (TMĐT)</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Tổng số tiền bạn đang có trên các sàn TikTok, Shopee nhưng chưa rút về tài khoản thật.
                      <strong className="text-yellow-600 dark:text-yellow-400"> Lưu ý:</strong> Chỉ là dự đoán, chưa tính vào quỹ. 
                      Chỉ khi rút tiền về và ghi vào "Sổ Thu Chi" thì mới tính vào quỹ.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">📊 Lợi nhuận sàn TMĐT</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Xem bạn đã lãi bao nhiêu từ các đơn hàng trên TikTok, Shopee trong khoảng thời gian bạn chọn:
                      <br />• <strong>Hôm nay:</strong> Chỉ tính đơn hàng hôm nay
                      <br />• <strong>7 ngày qua:</strong> Tính đơn hàng trong 7 ngày gần nhất
                      <br />• <strong>30 ngày qua:</strong> Tính đơn hàng trong 30 ngày gần nhất
                      <br />• <strong>90 ngày qua:</strong> Tính đơn hàng trong 90 ngày gần nhất
                      <br />
                      Mỗi sàn sẽ hiển thị riêng: TikTok, Shopee, và các sàn khác.
                      <br />
                      <strong className="text-yellow-600 dark:text-yellow-400 block mt-1">⚠️ Quan trọng:</strong> 
                      Đây chỉ là lợi nhuận dự đoán, <strong>KHÔNG tính vào phần thu chi thực tế</strong> vì tiền chưa về quỹ. 
                      Chỉ khi bạn rút tiền về và ghi vào "Sổ Thu Chi" thì mới tính vào thu chi thực tế.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">📊 Lợi nhuận</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Phần này khác với Thực tế (dựa trên giao dịch trong Sổ Thu Chi):
                      <br />• <strong>Lợi nhuận Ngày:</strong> Chỉ tính những ngày có bán được hàng (có lợi nhuận). Nếu ngày đó không bán được gì thì = 0 (không tính âm).
                      <br />• <strong>TB Tháng Lợi nhuận:</strong> Trung bình lợi nhuận mỗi ngày trong tháng (từ ngày 1 đến 30/31).
                      <br />• <strong>So sánh với nợ tháng này:</strong> Cho biết bạn còn dư hay thiếu so với nợ cần trả.
                      <br />• <strong>Số ngày dự kiến trả xong nợ:</strong> Ước tính bao lâu bạn sẽ trả hết tất cả nợ.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">📉 Tổng nợ cần trả</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Nếu bạn có nợ định kỳ, ở cuối phần "Tổng quan Quỹ" sẽ hiển thị:
                      <br />• Tổng số tiền nợ bạn cần trả (tất cả các khoản nợ định kỳ chưa trả)
                      <br />• Hiển thị với màu đỏ và biểu tượng mũi tên xuống để cảnh báo
                      <br />• Giúp bạn luôn nhớ tổng số nợ cần trả
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhập Đơn Hàng */}
            <div>
              <h3 className="text-lg font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-3">
                2. Nhập Đơn Hàng
              </h3>
              <div className="bg-deepSlate-800 dark:bg-deepSlate-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-deepSlate-300 mb-3">
                  <strong>Đây là nơi bạn tạo đơn hàng khi bán hàng:</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">📋 Chọn sản phẩm để bán</p>
                    <p className="text-sm text-deepSlate-300 ml-4">
                      Ở bên trái màn hình có danh sách tất cả sản phẩm của bạn. Mỗi sản phẩm hiển thị:
                      <br />• <strong>Vốn:</strong> Giá bạn mua vào
                      <br />• <strong>Bán lẻ:</strong> Giá bán cho khách lẻ
                      <br />• <strong>Bán sỉ:</strong> Giá bán cho khách sỉ (như khách "Dũng")
                      <br />• <strong>TikTok/Shopee:</strong> Giá bạn nhận về từ các sàn này
                      <br />• <strong>Số lượng:</strong> Còn bao nhiêu trong kho
                      <br />
                      Bạn có thể tìm kiếm sản phẩm bằng cách gõ tên vào ô tìm kiếm ở trên. Nhấn nút "Thêm" để thêm sản phẩm vào đơn hàng.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">➕ Thêm sản phẩm mới vào danh mục</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Nếu bạn có sản phẩm mới chưa có trong danh mục, nhấn nút "Thêm SP" để thêm vào. 
                      Nhập đầy đủ thông tin: Tên sản phẩm, giá vốn, các loại giá bán, và số lượng trong kho.
                      Khi bạn hoàn tất đơn hàng, số lượng trong kho sẽ tự động giảm đi.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">⚡ Thêm sản phẩm nhanh vào đơn</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Nếu bạn muốn bán một sản phẩm không có trong danh mục (ví dụ: hàng lẻ tẻ), 
                      nhấn "+ Thêm sản phẩm nhanh" trong phần đơn hàng, nhập tên và giá là xong. 
                      Sản phẩm sẽ được thêm vào đơn ngay lập tức.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">✏️ Chỉnh sửa đơn hàng</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Sau khi thêm sản phẩm vào đơn, bạn có thể:
                      <br />• Thay đổi số lượng: Nhấn nút + hoặc - hoặc gõ số trực tiếp
                      <br />• Thay đổi giá bán: Chọn giá từ danh sách hoặc nhập giá khác
                      <br />• Xóa sản phẩm: Nhấn vào biểu tượng thùng rác
                      <br />• Xem tổng tiền: Ở dưới sẽ hiển thị tổng doanh thu, giá vốn, lãi gộp
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">👤 Chọn khách hàng</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Chọn khách hàng từ danh sách, hoặc nhấn dấu + để thêm khách hàng mới. 
                      Nếu không chọn thì mặc định là "Khách lẻ".
                      <br />
                      <strong>Mẹo:</strong> Nếu bạn chọn khách "Dũng" và thanh toán bằng "Tiền mặt", 
                      hệ thống sẽ tự động áp dụng giá sỉ cho bạn.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">💳 Chọn hình thức thanh toán (quan trọng – dễ quên!)</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-4 mb-2">
                      Phần này được thiết kế to và dễ nhìn để bạn không bỏ sót khi hoàn tất đơn.
                    </p>
                    <div className="ml-4 space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>💵 Tiền mặt / 🏦 Chuyển khoản:</strong> Tiền cộng vào quỹ ngay. Tự động ghi Sổ Thu Chi.
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>📱 TikTok / 🛒 Shopee:</strong> Tiền chưa về quỹ. Khi rút về, ghi vào Sổ Thu Chi với danh mục "Rút tiền TikTok/Shopee".
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">✅ Hoàn tất đơn hàng</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Sau khi kiểm tra lại thông tin (khách hàng, sản phẩm, số lượng, giá, hình thức thanh toán), 
                      nhấn nút "Hoàn tất Đơn hàng".
                      <br />
                      Hệ thống sẽ tự động:
                      <br />• Lưu đơn hàng
                      <br />• Cộng tiền vào quỹ (nếu thanh toán bằng tiền mặt/chuyển khoản)
                      <br />• Trừ số lượng hàng trong kho
                      <br />• Ghi vào "Sổ Thu Chi" (nếu cần)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sổ Thu Chi */}
            <div>
              <h3 className="text-lg font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-3">
                3. Sổ Thu Chi
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Đây là cuốn sổ ghi chép tất cả các khoản thu chi hàng ngày của bạn:</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">➕ Ghi một giao dịch mới</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Nhấn nút "+ Thêm giao dịch", sau đó điền:
                      <br />• <strong>Ngày:</strong> Ngày nào xảy ra giao dịch
                      <br />• <strong>Loại:</strong> Thu (nhận tiền) hay Chi (chi tiền)
                      <br />• <strong>Danh mục:</strong> Thu/chi vào mục gì (ví dụ: Bán hàng, Ăn uống, Tiền nhà...)
                      <br />• <strong>Ví:</strong> Tiền mặt hay Ngân hàng
                      <br />• <strong>Số tiền:</strong> Bao nhiêu tiền
                      <br />• <strong>Ghi chú:</strong> Ghi thêm thông tin nếu cần
                      <br />
                      Sau khi lưu, số tiền trong quỹ sẽ tự động thay đổi.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">💰 Rút tiền từ TikTok/Shopee về</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Khi bạn rút tiền từ TikTok hoặc Shopee về tài khoản thật, bạn cần ghi vào đây:
                      <br />• Nhấn "+ Thêm giao dịch"
                      <br />• Chọn loại: <strong>Thu</strong>
                      <br />• Chọn danh mục: <strong>"Rút tiền TikTok"</strong> hoặc <strong>"Rút tiền Shopee"</strong>
                      <br />• Điền số tiền đã rút về
                      <br />
                      Việc này giúp hệ thống tính đúng số tiền bạn thực sự kiếm được mỗi ngày/tháng.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">💸 Trả nợ định kỳ (Nợ trả hàng tháng)</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4 mb-2">
                      <strong>Mới:</strong> Bạn có thể thiết lập nợ trả định kỳ hàng tháng để hệ thống tự động nhắc nhở:
                    </p>
                    <div className="ml-4 space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Cách thiết lập nợ định kỳ:</strong>
                      </p>
                      <ol className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-decimal space-y-1">
                        <li>Nhấn nút "Trả nợ" trong phần Sổ Thu Chi</li>
                        <li>Điền thông tin:
                          <br />• <strong>Tên chủ nợ:</strong> Tên người/ngân hàng bạn vay (ví dụ: "Ngân hàng ABC", "Anh Dũng")
                          <br />• <strong>Định kỳ trả nợ:</strong> Chọn ngày trong tháng bạn sẽ trả (ví dụ: ngày 15 hàng tháng)
                          <br />• <strong>Số tháng còn lại:</strong> Còn bao nhiêu tháng phải trả (ví dụ: 10 tháng)
                        </li>
                        <li>Điền số tiền cho từng tháng:
                          <br />• Mỗi tháng sẽ có một dòng để nhập <strong>Tiền gốc</strong> và <strong>Tiền lãi</strong> (nếu có)
                          <br />• Tiền lãi có thể để trống nếu không có
                          <br />• Ví dụ: Tháng 1: Gốc 1,000,000₫, Lãi 50,000₫
                        </li>
                        <li>Nhấn "Lưu" để hoàn tất</li>
                      </ol>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
                        <strong>Nhắc nhở trả nợ:</strong>
                        <br />Ở đầu danh sách "Sổ Thu Chi" sẽ có phần <strong>"Nợ cần thanh toán"</strong> hiển thị:
                        <br />• Tên chủ nợ
                        <br />• Ngày đến hạn trả
                        <br />• Số ngày còn lại (hoặc đã quá hạn)
                        <br />• Số tiền cần trả
                        <br />• Nút <strong>"Thanh toán"</strong> (chỉ bật khi đến ngày hoặc quá hạn)
                      </p>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        <strong>Khi trả nợ:</strong>
                        <br />• Nhấn nút "Thanh toán" ở phần "Nợ cần thanh toán"
                        <br />• Hệ thống sẽ tự động tạo 2 giao dịch:
                        <br />  - <strong>Trả nợ gốc:</strong> Không tính vào chi phí (chỉ giảm tài sản)
                        <br />  - <strong>Lãi vay:</strong> Tính vào chi phí danh mục "Lãi vay"
                        <br />• Sau khi trả, khoản nợ đó sẽ không còn hiển thị trong "Nợ cần thanh toán" nữa
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🗑️ Xóa giao dịch</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Nếu bạn ghi nhầm, nhấn vào biểu tượng thùng rác để xóa giao dịch đó.
                      <br />Số tiền trong quỹ sẽ tự động được điều chỉnh lại.
                      <br />
                      <strong>Lưu ý:</strong> Có thể xóa giao dịch "So khớp" nếu cần điều chỉnh lại.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-deepSlate-50 dark:text-deepSlate-100 mb-1">🔄 So khớp quỹ</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Đôi khi số tiền trên màn hình khác với số tiền thực tế bạn có (ví dụ: bạn quên ghi một khoản chi).
                      <br />Để điều chỉnh:
                      <br />1. Vào phần "Tổng quan Quỹ"
                      <br />2. Nhấn nút "So khớp" ở ô Tiền mặt hoặc Ngân hàng
                      <br />3. Nhập số tiền thực tế bạn có
                      <br />4. Hệ thống sẽ tự động tạo một giao dịch điều chỉnh để số tiền trên màn hình khớp với thực tế
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">📦 So khớp kho</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Tương tự như so khớp quỹ, nhưng dùng để kiểm tra số lượng hàng trong kho:
                      <br />1. Vào phần "Tổng quan Quỹ"
                      <br />2. Nhấn vào ô "Tiền Hàng" để mở cửa sổ so khớp
                      <br />3. Nhập số lượng thực tế của từng sản phẩm
                      <br />4. Nếu thiếu hàng (số lượng thực tế ít hơn số lượng trên hệ thống), 
                      hệ thống sẽ tự động tạo một giao dịch chi "Thất thoát hàng hóa"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Báo cáo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                4. Báo cáo
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Xem các báo cáo và thống kê về tài chính của bạn:</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">📊 Biểu đồ thác nước - Dòng tiền thực tế</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Hiển thị chi tiết từng ngày trong tháng với 3 cột:
                      <br />• <strong>Thu (màu xanh lá):</strong> Số tiền thu được trong ngày
                      <br />• <strong>Chi (màu đỏ):</strong> Số tiền chi ra trong ngày
                      <br />• <strong>Lợi nhuận (màu xanh dương/cam):</strong> Thu - Chi (xanh nếu dương, cam nếu âm)
                      <br />
                      Tất cả các ngày trong tháng đều được hiển thị để bạn theo dõi chi tiết. 
                      Có thể kéo thả thanh cuộn ở dưới để xem các ngày khác.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">📊 Cột nợ - Mức nợ</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Biểu đồ cột ngang hiển thị các mức nợ từ 100k đến 5000k:
                      <br />• Màu đỏ: Các mức nợ bạn đã đạt
                      <br />• Màu xám: Các mức nợ bạn chưa đạt
                      <br />• Giúp bạn theo dõi tổng nợ hiện tại và các mốc quan trọng
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">📊 So sánh Mục tiêu vs Thực tế</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Biểu đồ so sánh 2 cột:
                      <br />• <strong>Mục tiêu (xanh lá):</strong> Số tiền bạn muốn kiếm
                      <br />• <strong>Thực tế (xanh dương):</strong> Số tiền bạn thực sự kiếm được
                      <br />
                      Hiển thị chênh lệch và cho biết bạn đã đạt hay chưa đạt mục tiêu.
                      <br /><strong>Lưu ý:</strong> Chỉ hiển thị khi bạn đã đặt mục tiêu trong phần "Tổng quan Quỹ".
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🤖 Phân tích Dữ liệu Tài chính (Mới)</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4 mb-2">
                      <strong>Tính năng thông minh:</strong> Hệ thống tự động phân tích và đưa ra nhận định như một chuyên gia:
                    </p>
                    <div className="ml-4 space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>✅ Nhận định tích cực:</strong>
                        <br />• Khả năng trả nợ tốt
                        <br />• Tiến độ trả nợ tích cực
                        <br />• Vượt mục tiêu
                        <br />• Nguồn thu chính
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>⚠️ Cảnh báo và Lưu ý:</strong>
                        <br />• Không đủ khả năng trả nợ tháng này
                        <br />• Chưa đạt mục tiêu
                        <br />• Dòng tiền âm
                        <br />• Tỷ lệ chi phí cao
                        <br />• Tần suất lợi nhuận thấp
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>💡 Khuyến nghị Hành động:</strong>
                        <br />• Cách cải thiện biên lợi nhuận
                        <br />• Đề xuất tăng thu nhập hoặc giảm chi phí
                        <br />• Phân tích tại sao mục tiêu lâu hơn dự kiến
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>📈 Tóm tắt Phân tích:</strong>
                        <br />• Tổng nợ và nợ tháng này
                        <br />• Số ngày dự kiến trả hết nợ
                        <br />• Tỷ lệ nợ/thu nhập
                        <br />• So sánh mục tiêu vs thực tế
                        <br />• Chênh lệch và số ngày dự kiến đạt mục tiêu
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">📅 Lọc theo thời gian</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Ở góc trên bên phải, bạn có thể chọn khoảng thời gian để xem báo cáo:
                      <br />• 7 ngày qua
                      <br />• 30 ngày qua
                      <br />• 90 ngày qua
                      <br />• 1 năm qua
                      <br />• Tất cả
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cấu hình */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                5. Cấu hình
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Quản lý danh mục và cài đặt:</strong>
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-disc">
                  <li><strong>Danh mục Thu nhập, Chi phí, Nhập:</strong> Ba loại danh mục hiển thị ở dưới. Thu nhập: các khoản thu. Chi phí: các khoản chi. Nhập: số tiền đang có (không tính lợi nhuận). Thêm/xóa danh mục tùy nhu cầu.</li>
                  <li><strong>Xem hướng dẫn:</strong> Nhấn nút "Xem Hướng Dẫn" (ở đầu trang này) để xem lại hướng dẫn chi tiết.</li>
                  <li><strong>Xóa toàn bộ dữ liệu:</strong> Nhấn "Xóa toàn bộ dữ liệu", nhập mật khẩu để xác nhận. Xóa sạch mọi thứ (sản phẩm, khách hàng, giao dịch, đơn hàng, nợ, tiền mặt/ngân hàng). <strong className="text-green-600 dark:text-green-400">Chỉ giữ lại tài khoản đăng nhập.</strong>
                    <br /><strong className="text-red-600 dark:text-red-400">Cảnh báo:</strong> Không thể hoàn tác!
                  </li>
                </ul>
              </div>
            </div>

            {/* Chọn Chủ Đề Màu Sắc */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                6. Chọn Chủ Đề Màu Sắc
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Tùy chỉnh giao diện ứng dụng theo sở thích của bạn:</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🎨 10 Chủ Đề Màu Sắc</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4 mb-2">
                      Ứng dụng cung cấp 10 chủ đề màu khác nhau, được chia thành 2 nhóm:
                    </p>
                    <div className="ml-4 space-y-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        👩 Chủ đề dành cho phụ nữ (Nữ tính, mềm mại):
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc space-y-1">
                        <li><strong>Hồng Phấn Nàng Thơ:</strong> Màu hồng nhạt, duyên dáng, phù hợp với phong cách hiện đại</li>
                        <li><strong>Cánh Sen Quyền Lực:</strong> Màu tím hồng, quyến rũ, toát lên vẻ quyền lực và sự kiêu sa</li>
                        <li><strong>Mật Đào Ngọt Ngào:</strong> Màu cam đỏ ấm áp, mang cảm giác dễ chịu và thoải mái</li>
                        <li><strong>Quý Cô Thượng Lưu:</strong> Màu nâu vàng sang trọng, phù hợp với phong cách cổ điển và quý phái</li>
                        <li><strong>Hồng Kẹo Ngọt Chốt Đơn:</strong> Màu hồng đỏ rực rỡ, năng động, tạo cảm hứng cho việc bán hàng</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      👨 Chủ đề dành cho nam giới (Mạnh mẽ, chuyên nghiệp):
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc space-y-1">
                      <li><strong>Bản Lĩnh Thép:</strong> Màu xanh lam sáng, toát lên sự tự tin và quyết đoán</li>
                      <li><strong>Đế Chế Xanh Navy:</strong> Màu xanh navy đậm, sang trọng, biểu tượng của sự mạnh mẽ</li>
                      <li><strong>Sói Đêm Độc Hành:</strong> Màu xanh tối, bí ẩn, dành cho những ai thích phong cách bí ẩn</li>
                      <li><strong>Thung Lũng Tỷ Đô:</strong> Màu vàng gold, tượng trưng cho sự giàu có và thành công</li>
                      <li><strong>Đêm Đô Thị:</strong> Màu đỏ rực rỡ, mạnh mẽ, thể hiện quyết tâm và năng lực kinh doanh</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 mt-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🔄 Cách Chuyển Đổi Chủ Đề</p>
                <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                  <p><strong>Bước 1:</strong> Nhấn vào nút 🔧 "Cấu hình" ở góc phải màn hình hoặc tìm phần "Cấu hình"</p>
                  <p><strong>Bước 2:</strong> Cuộn xuống tìm phần <strong>"Chọn Chủ Đề Màu Sắc"</strong></p>
                  <p><strong>Bước 3:</strong> Xem các chủ đề được hiển thị dưới dạng lưới với hình ảnh màu sắc</p>
                  <p><strong>Bước 4:</strong> Nhấn vào chủ đề bạn thích</p>
                  <p><strong>Bước 5:</strong> Giao diện sẽ thay đổi ngay lập tức với các màu sắc mới của chủ đề</p>
                  <p><strong>Lưu ý:</strong> Lựa chọn chủ đề của bạn được lưu tự động, vì vậy lần tiếp theo bạn mở ứng dụng, nó sẽ hiển thị chủ đề mà bạn chọn.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 mt-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Gợi Ý Chọn Chủ Đề</p>
                <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                  <p>
                    <strong>Phụ nữ kinh doanh:</strong> Chọn "Hồng Phấn Nàng Thơ" hoặc "Cánh Sen Quyền Lực" để tạo ấn tượng chuyên nghiệp nhưng vẫn nữ tính
                  </p>
                  <p>
                    <strong>Nam giới kinh doanh:</strong> Chọn "Đế Chế Xanh Navy" hoặc "Bản Lĩnh Thép" để tạo ấn tượng chuyên nghiệp và mạnh mẽ
                  </p>
                  <p>
                    <strong>Bán hàng online:</strong> Chọn "Hồng Kẹo Ngọt Chốt Đơn" hoặc "Đêm Đô Thị" để tạo cảm giác năng động và thu hút khách
                  </p>
                  <p>
                    <strong>Cảm thấy mệt mỏi với ánh sáng:</strong> Các chủ đề tối (Sói Đêm, Đế Chế Xanh Navy) giúp bảo vệ mắt khi sử dụng lâu
                  </p>
                </div>
              </div>
            </div>

            {/* Trợ Lý Ảo & Chat Support */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                7. Trợ Lý Ảo & Chat Support
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Nhận hỗ trợ và tư vấn ngay từ trong ứng dụng:</strong>
                </p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💬 Cách Sử Dụng Chat Support</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                      <p><strong>Bước 1:</strong> Tìm nút chat hình bong bóng xanh 💬 ở góc dưới bên phải màn hình chính</p>
                      <p><strong>Bước 2:</strong> Nhấn vào bong bóng để mở cửa sổ chat</p>
                      <p><strong>Bước 3:</strong> Nhập câu hỏi hoặc yêu cầu hỗ trợ của bạn</p>
                      <p><strong>Bước 4:</strong> Nhấn "Gửi" hoặc phím Enter để gửi tin nhắn</p>
                      <p><strong>Bước 5:</strong> Chờ phản hồi từ trợ lý ảo (thường trong vòng 1-5 giây)</p>
                      <p><strong>Bước 6:</strong> Lịch sử chat của bạn sẽ được lưu tự động, bạn có thể quay lại xem lại bất kỳ lúc nào</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Những Câu Hỏi Bạn Có Thể Hỏi</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-1">
                      <p><strong>Về Tài Chính:</strong></p>
                      <ul className="ml-4 list-disc">
                        <li>Làm thế nào để tính lợi nhuận chính xác?</li>
                        <li>Tôi nên đặt mục tiêu bao nhiêu để hợp lý?</li>
                        <li>Cách quản lý nợ hiệu quả như thế nào?</li>
                        <li>Lợi nhuận ngày vs lợi nhuận thực tế là gì?</li>
                      </ul>

                      <p className="mt-2"><strong>Về Kinh Doanh:</strong></p>
                      <ul className="ml-4 list-disc">
                        <li>Sản phẩm nào có lợi nhuận cao nhất?</li>
                        <li>Khách hàng nào đang nợ nhiều nhất?</li>
                        <li>Tôi nên giảm giá sản phẩm nào?</li>
                        <li>Lợi nhuận tôi sẽ đạt được khi nào?</li>
                      </ul>

                      <p className="mt-2"><strong>Về Sử Dụng Ứng Dụng:</strong></p>
                      <ul className="ml-4 list-disc">
                        <li>Làm thế nào để xuất dữ liệu?</li>
                        <li>Tôi quên mật khẩu phải làm sao?</li>
                        <li>Làm thế nào để xóa một giao dịch nhầm?</li>
                        <li>Dữ liệu của tôi có an toàn không?</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">⚡ Lợi Ích của Chat Support</p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc space-y-1">
                      <li><strong>Luôn sẵn sàng:</strong> Chat support hoạt động 24/7, bạn có thể hỏi bất kỳ lúc nào</li>
                      <li><strong>Nhanh chóng:</strong> Nhận phản hồi ngay lập tức mà không cần chờ</li>
                      <li><strong>Tư vấn tài chính:</strong> Nhận lời tư vấn từ AI được huấn luyện chuyên sâu về tài chính kinh doanh</li>
                      <li><strong>Gợi ý hành động:</strong> Không chỉ trả lời mà còn gợi ý cách cải thiện tài chính</li>
                      <li><strong>Giữ lịch sử:</strong> Toàn bộ cuộc trò chuyện được lưu, bạn có thể xem lại bất kỳ lúc nào</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Mẹo Sử Dụng Chat Hiệu Quả</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                      <p>
                        <strong>Hỏi cụ thể:</strong> Thay vì "Làm sao kiếm nhiều tiền?", hãy hỏi "Sản phẩm nào đang có lợi nhuận cao nhất trong cửa hàng của tôi?"
                      </p>
                      <p>
                        <strong>Cung cấp bối cảnh:</strong> Nêu rõ số liệu hoặc tình huống của bạn để nhận được lời tư vấn chính xác hơn
                      </p>
                      <p>
                        <strong>Hỏi theo từng vấn đề:</strong> Thay vì hỏi nhiều vấn đề cùng lúc, tách thành những câu hỏi riêng biệt
                      </p>
                      <p>
                        <strong>Yêu cầu chi tiết:</strong> Nếu cần giải thích thêm, hãy yêu cầu "Giải thích chi tiết hơn" hoặc "Cho ví dụ cụ thể"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mẹo & Thủ Thuật */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                8. Mẹo & Thủ Thuật
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Một số mẹo giúp sử dụng ứng dụng hiệu quả hơn:</strong>
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">⌨️ Phím Tắt Hữu Ích</p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc space-y-1">
                      <li><strong>Tab + Enter:</strong> Nhanh chóng tạo giao dịch trong các trường nhập liệu</li>
                      <li><strong>Ctrl + Z (hoặc Cmd + Z):</strong> Hoàn tác lần thay đổi cuối cùng (nếu được hỗ trợ)</li>
                      <li><strong>Refresh F5:</strong> Nếu ứng dụng gặp lỗi, refresh trang để khôi phục</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">📱 Sử Dụng Trên Điện Thoại</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Ứng dụng tương thích với điện thoại (iPhone, Android). Bạn có thể:
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc space-y-1 mt-2">
                      <li>Truy cập ứng dụng qua trình duyệt điện thoại</li>
                      <li>Nhập giao dịch ngay khi bán hàng (ghi chép thực tế)</li>
                      <li>Kiểm tra tài chính bất kỳ lúc nào</li>
                      <li>Nhắn tin tới trợ lý ảo để hỏi tư vấn</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🔐 Bảo Mật Dữ Liệu</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                      <p>
                        <strong>Dữ liệu được lưu ở đâu?</strong> Tất cả dữ liệu được lưu trên trình duyệt của bạn (localStorage) để bảo mật cấp độ cao.
                      </p>
                      <p>
                        <strong>Nên sao lưu:</strong> Định kỳ (hàng tuần hoặc hàng tháng) ghi chép hoặc chụp ảnh những số liệu quan trọng để tránh mất dữ liệu nếu bạn xóa dữ liệu trình duyệt.
                      </p>
                      <p>
                        <strong>Đổi máy tính:</strong> Nếu bạn chuyển sang máy tính khác, dữ liệu sẽ không còn. Bạn cần sao lưu trước đó.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🔄 Đồng Bộ Dữ Liệu</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                      <p>
                        <strong>Cách hoạt động:</strong> Mỗi khi bạn thêm/sửa/xóa dữ liệu, ứng dụng sẽ tự động lưu vào máy của bạn.
                      </p>
                      <p>
                        <strong>Kiểm tra trạng thái:</strong> Nhìn biểu tượng "Save" hoặc "Sync" ở đầu trang để xem dữ liệu đã được lưu hay chưa.
                      </p>
                      <p>
                        <strong>Lưu ý:</strong> Nếu bạn tắt trình duyệt mà chưa chờ dữ liệu lưu, có thể mất những thay đổi cuối cùng.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">📊 Xuất & Nhập Dữ Liệu</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 ml-4 space-y-2">
                      <p>
                        <strong>Tạo sao lưu:</strong> Ngoài ghi chép thủ công, bạn có thể liên hệ admin để yêu cầu xuất dữ liệu (CSV, Excel).
                      </p>
                      <p>
                        <strong>Nhập lại dữ liệu:</strong> Nếu bạn có file Excel hoặc CSV cũ, có thể yêu cầu nhập lại vào ứng dụng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Câu Hỏi Thường Gặp */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                9. Câu Hỏi Thường Gặp (FAQ)
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Làm sao biết lợi nhuận thực tế?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Lợi nhuận thực tế = Tổng tiền thu - Tổng tiền chi (từ Sổ Thu Chi). Điều này khác với "Lợi nhuận Ngày" vì nó bao gồm tất cả các loại giao dịch, không chỉ bán hàng.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Tôi ghi nhầm một giao dịch, phải làm sao?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Nhấn vào biểu tượng thùng rác 🗑️ ở hàng giao dịch để xóa nó. Hoặc bạn có thể sửa lại bằng cách nhấn vào giao dịch để chỉnh sửa chi tiết.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Sao số tiền trên ứng dụng khác với tiền thực tế?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Có thể bạn quên ghi một khoản chi hoặc chưa cập nhật tiền từ sàn. Sử dụng tính năng "So khớp" trong phần "Tổng quan Quỹ" để điều chỉnh số tiền thực tế.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Nợ được tính như thế nào?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Nợ = Tiền bạn cần phải trả (từ giao dịch Nợ hoặc trả nợ). Nợ không ảnh hưởng trực tiếp đến lợi nhuận, nhưng ảnh hưởng đến khả năng thanh toán của bạn. Khi bạn trả nợ, hệ thống tự động tạo giao dịch để cập nhật.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Tôi có thể xóa toàn bộ dữ liệu được không?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Có, nhưng <strong className="text-red-600 dark:text-red-400">cực kỳ cẩn thận!</strong> Nhấn "Xóa toàn bộ dữ liệu" trong phần Cấu hình, nhập mật khẩu xác nhận. Mọi dữ liệu sẽ bị xóa, chỉ giữ lại tài khoản đăng nhập. <strong>KHÔNG THỂ HOÀN TÁC!</strong>
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Làm sao để liên hệ hỗ trợ?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Bạn có thể:
                    <br />1. Sử dụng <strong>Chat Support</strong> (bong bóng xanh ở góc phải) để hỏi
                    <br />2. Liên hệ qua email hoặc điện thoại với admin (nếu có trong ứng dụng)
                    <br />3. Để lại feedback hoặc báo cáo lỗi qua phần "Phản hồi" (nếu có)
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">❓ Ứng dụng có tính phí không?</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                    Không, ứng dụng hoàn toàn miễn phí cho bạn sử dụng. Mục đích của chúng tôi là giúp bạn quản lý tài chính kinh doanh hiệu quả.
                  </p>
                </div>
              </div>
            </div>

            {/* Liên Hệ & Hỗ Trợ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                10. Liên Hệ & Hỗ Trợ
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>Cần hỗ trợ hoặc muốn gửi phản hồi? Liên hệ với chúng tôi:</strong>
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💬 Chat Support</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Hãy sử dụng <strong>Chat Support</strong> (bong bóng xanh ở góc phải màn hình) để được hỗ trợ ngay lập tức. Đây là cách nhanh nhất để nhận trợ giúp.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">📧 Email</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Để lại email hoặc thông tin liên hệ trong chat, team sẽ liên hệ bạn trong vòng 24 giờ.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🐛 Báo Cáo Lỗi</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Nếu bạn gặp phải lỗi hoặc vấn đề gì, hãy:
                      <br />1. Ghi chép chi tiết vấn đề (khi nào xảy ra, điều gì bạn đang làm)
                      <br />2. Nêu ra bằng cách nào để tái hiện lỗi
                      <br />3. Gửi cho team qua chat support
                      <br />4. Team sẽ xử lý trong thời gian sớm nhất
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💡 Gửi Đề Xuất Tính Năng</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Nếu bạn có ý tưởng để cải thiện ứng dụng, hãy chia sẻ với chúng tôi qua chat support. Chúng tôi rất mong nhận được phản hồi từ bạn!
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">⏱️ Thời Gian Hỗ Trợ</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-4">
                      Chat Support: 24/7, bạn có thể nhắn bất kỳ lúc nào
                      <br />Email/Điện thoại: Thứ Hai - Chủ Nhật, 8:00 - 22:00 (Giờ Hà Nội)
                      <br />Phản hồi thường trong vòng 1 - 2 giờ trong giờ làm việc
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lưu ý quan trọng */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                ⚠️ Những điều quan trọng cần nhớ
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-2 ml-4 list-disc">
                <li><strong>Tiền trên TikTok/Shopee:</strong> 
                  <br />Tiền bạn thấy trên các sàn TikTok, Shopee chỉ là dự đoán, chưa tính vào quỹ thực tế của bạn.
                  <br />Chỉ khi bạn rút tiền về tài khoản và ghi vào "Sổ Thu Chi" với danh mục "Rút tiền TikTok" hoặc "Rút tiền Shopee" thì mới tính vào quỹ.
                </li>
                <li><strong>Lợi nhuận Ngày / TB Tháng:</strong> 
                  <br />Lợi nhuận Ngày chỉ tính những ngày có bán được (có lãi); ngày không bán = 0. TB Tháng = trung bình lợi nhuận mỗi ngày trong tháng (1–30/31). Khác với Thực tế (dựa trên giao dịch Sổ Thu Chi).
                </li>
                <li><strong>So khớp định kỳ:</strong> 
                  <br />Thỉnh thoảng bạn nên kiểm tra và so khớp lại số tiền trong quỹ và số lượng hàng trong kho để đảm bảo số liệu chính xác.
                  <br />Có thể làm hàng tuần hoặc hàng tháng tùy bạn.
                </li>
                <li><strong>Lưu trữ dữ liệu:</strong> 
                  <br />Tất cả dữ liệu được lưu trên trình duyệt của bạn. Nếu bạn xóa dữ liệu trình duyệt hoặc đổi máy tính, dữ liệu sẽ mất.
                  <br />Nên sao lưu dữ liệu định kỳ bằng cách xuất ra file hoặc ghi chép lại những số liệu quan trọng.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-600 mr-2" />
            Danh mục Thu nhập
          </h2>
          <div className="space-y-2">
            {(categories?.income || []).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {cat.name}
                </span>
                <button
                  onClick={() => handleDelete(cat.id, "income")}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(!categories?.income || categories.income.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có danh mục nào
              </p>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 mr-2" />
            Danh mục Chi phí
          </h2>
          <div className="space-y-2">
            {(categories?.expense || []).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {cat.name}
                </span>
                <button
                  onClick={() => handleDelete(cat.id, "expense")}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(!categories?.expense || categories.expense.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có danh mục nào
              </p>
            )}
          </div>
        </div>

        {/* Nhập Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2" />
            Danh mục Nhập
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Số tiền đang có, không tính lợi nhuận</p>
          <div className="space-y-2">
            {(categories?.nhap || []).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {cat.name}
                </span>
                <button
                  onClick={() => handleDelete(cat.id, "nhap")}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(!categories?.nhap || categories.nhap?.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Chưa có danh mục nào
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Lưu ý về Danh mục
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 ml-4">
          <li>• Danh mục giúp bạn phân loại và theo dõi các khoản thu chi</li>
          <li>• Một số danh mục mặc định được tạo sẵn khi khởi tạo ứng dụng</li>
          <li>• Bạn có thể thêm danh mục mới tùy theo nhu cầu kinh doanh</li>
          <li>• Xóa danh mục không ảnh hưởng đến các giao dịch đã lưu</li>
        </ul>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Thêm danh mục mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại danh mục
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="income">Thu nhập</option>
                  <option value="expense">Chi phí</option>
                  <option value="nhap">Nhập (số tiền đang có)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Ví dụ: Bán hàng online, Tiền điện..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                ⚠️ Xóa toàn bộ dữ liệu
              </h3>
              <button
                onClick={closeResetModal}
                disabled={resetVerifying}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Xóa <strong>tất cả</strong> dữ liệu của tài khoản, trả về trạng thái <strong>ngày đầu chưa có hoạt động</strong>. Không tạo mẫu, tránh trùng lặp.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Xóa: sản phẩm, khách hàng, giao dịch, đơn hàng, nợ, ứng hàng, tiền mặt/ngân hàng. <strong className="text-green-600 dark:text-green-400">Chỉ giữ tài khoản đăng nhập.</strong>
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🔐 <strong>Tài khoản Admin được bảo vệ:</strong> Tài khoản vinhsatan@gmail.com sẽ <strong>KHÔNG bị xóa</strong> khi reset dữ liệu. Tất cả các tài khoản khác cũng được giữ lại - chỉ xóa dữ liệu quản lý.
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Để xác nhận, vui lòng nhập mật khẩu đăng nhập của bạn.
              </p>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu đăng nhập
              </label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => {
                  setResetPassword(e.target.value);
                  setResetError("");
                }}
                placeholder="Nhập mật khẩu"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={resetVerifying}
                autoComplete="current-password"
              />
              {resetError && (
                <div className="mt-2">
                  <p className="text-sm text-red-600 dark:text-red-400">{resetError}</p>
                  {resetError.includes("Lỗi kết nối") || resetError.includes("API") ? (
                    <button
                      type="button"
                      onClick={handleResetWithoutApi}
                      disabled={resetVerifying}
                      className="mt-2 text-sm text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      Xóa chỉ trên thiết bị này (khi API lỗi)
                    </button>
                  ) : null}
                </div>
              )}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Sẽ bị xóa sạch:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 ml-4 list-disc">
                  <li>Tiền mặt và ngân hàng về 0</li>
                  <li>Tất cả sản phẩm</li>
                  <li>Tất cả khách hàng</li>
                  <li>Tất cả nợ cần trả</li>
                  <li>Tất cả giao dịch (Sổ Thu Chi)</li>
                  <li>Tất cả đơn hàng</li>
                </ul>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mt-3 mb-1">
                  Chỉ giữ lại: tài khoản đăng nhập
                </p>
              </div>
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-4">
                ⚠️ Hành động này KHÔNG THỂ HOÀN TÁC!
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeResetModal}
                disabled={resetVerifying}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleResetData}
                disabled={resetVerifying || !resetPassword.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetVerifying ? "Đang xác thực…" : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Promotion */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">👇 NHẬN 5 CÂU TRÍCH DẪN ĐỘNG LỰC CỨ MỖI 30P</p>
          <p className="text-sm mb-3">BẮT ĐẦU TỪ 7H SÁNG - 10H ĐÊM TẠI KÊNH TELEGRAM</p>
          <a
            href="https://t.me/vinreviewsach"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-md"
          >
            🔗 https://t.me/vinreviewsach
          </a>
        </div>
      </div>
    </div>
  );
}
