import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../../AppContext.js';
import styles from './HistoryPage.module.css';
import Notification from '../../components/user-components/Notification.js';
import Loader from '../../components/user-components/loader.js';
import defaultImage from '../../assets/default_item.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt, faCalendar, faMoneyBill, faCheck, faBan, faHandHoldingUsd, faPhone } from '@fortawesome/free-solid-svg-icons';

const HistoryPage = () => {
    const { getCSRFToken, getCookie, baseUrl } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [expandedOrderIds, setExpandedOrderIds] = useState([]);
    const [filters, setFilters] = useState({
        sortBy: 'time',
        status: 'all',
    });

    const fetchOrderHistory = useCallback(async function () {
        setLoading(true);
        try {
            await getCSRFToken();
            const xsrfToken = getCookie('XSRF-TOKEN');
            const response = await fetch(`${baseUrl}/api/customer/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const orderData = await response.json();
            setOrders(orderData);
        } catch (error) {
            console.error('Error fetching order history:', error);
            setNotification({ message: 'Đã xảy ra lỗi khi tải lịch sử đơn hàng!', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [baseUrl, getCSRFToken, getCookie]);

    // Hàm thay đổi trạng thái mở/đóng chi tiết hóa đơn
    const toggleDetails = useCallback(function (orderId) {
        setExpandedOrderIds(function (prevIds) {
            if (prevIds.includes(orderId)) {
                return prevIds.filter(function (id) {
                    return id !== orderId; // Loại bỏ orderId khỏi danh sách
                });
            }
            return [...prevIds, orderId];
        });
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target; // Lấy tên và giá trị từ sự kiện
        setFilters((prev) => ({ ...prev, [name]: value })); // Tạo bản sao từ prev (giá trị hiện tại) bằng ...prev và thêm name:value tương ứng vào filters
    };

    // Danh sách đơn hàng đã được lọc và sắp xếp
    const filteredOrders = orders
        .filter((order) => filters.status === 'all')
        .sort((a, b) => {
            if (filters.sortBy === 'time') {
                return filters.sortOrder === 'asc' 
                    ? new Date(a.NGAYLAPHD) - new Date(b.NGAYLAPHD) // Sắp xếp tăng dần
                    : new Date(b.NGAYLAPHD) - new Date(a.NGAYLAPHD);
            }
            if (filters.sortBy === 'value') {
                return filters.sortOrder === 'asc' 
                    ? a.TRIGIAHD - b.TRIGIAHD // Sắp xếp tăng dần
                    : b.TRIGIAHD - a.TRIGIAHD;
            }
            return 0;  // Không thay đổi
        });

    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    return (
        <div className={styles.historyPage}>
            <div className={styles.historyContainer}>
                <h1>Lịch sử đơn hàng</h1>
                <div className={styles.filtersContainer}>
                    <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                        <option value="time">Sắp xếp theo thời gian</option>
                        <option value="value">Sắp xếp theo giá trị</option>
                    </select>
                    <button
                        className={`${styles.sortOrderToggle} ${filters.sortOrder === 'asc' ? styles.active : ''}`}
                        onClick={() => setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                    >
                        {filters.sortOrder === 'asc' ? '▲' : '▼'}
                    </button>
                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="all">Tất cả trạng thái</option>
                        <option value="0">Chờ xử lý</option>
                        <option value="1">Đã xử lý</option>
                        <option value="2">Đã hủy</option>
                    </select>
                </div>

                {loading && <Loader />}
                {!loading && filteredOrders.length === 0 && <p>Không có đơn hàng nào.</p>}
                {!loading && filteredOrders.length > 0 && (
                    <div className={styles.ordersList}>
                        {filteredOrders.map((order) => {
                            const isExpanded = expandedOrderIds.includes(order.ID_HOADON);
                            const tienTietKiem = order.TRIGIAHD - order.TIENPHAITRA;
                            return (
                                <div key={order.ID_HOADON} className={styles.orderItem}>
                                    <div className={styles.orderSummary}>
                                        <div className={styles.orderHeader}>
                                            <div className={styles.iconText}>
                                                <FontAwesomeIcon icon={faReceipt} className={styles.icon} />
                                                <p>Mã Hóa Đơn: <b>{order.ID_HOADON}</b></p>
                                            </div>
                                            <div className={styles.iconText}>
                                                <FontAwesomeIcon icon={faCalendar} className={styles.icon} />
                                                <p>Ngày Mua: {order.NGAYLAPHD}</p>
                                            </div>
                                            <div className={styles.iconText}>
                                                <FontAwesomeIcon icon={order.TRANGTHAI === 0 ? faCheck : faBan} className={styles.icon} />
                                                <p>Trạng Thái: {order.TRANGTHAI === 0 ? 'Chờ xử lý' : order.TRANGTHAI === 1 ? 'Đã xử lý' : 'Đã hủy'}</p>
                                            </div>
                                        </div>

                                        <div className={styles.orderFooter}>
                                            <div className={styles.iconText}>
                                                <FontAwesomeIcon icon={faMoneyBill} className={styles.icon} />
                                                <p>Tổng Giá Trị: {order.TRIGIAHD.toLocaleString()} VNĐ</p>
                                            </div>
                                            <div className={styles.iconText}>
                                                <FontAwesomeIcon icon={faMoneyBill} className={styles.icon} />
                                                <p>Số Tiền Trả: {order.TIENPHAITRA.toLocaleString()} VNĐ</p>
                                            </div>
                                            <div className={styles.iconText}>
                                                <FontAwesomeIcon icon={faHandHoldingUsd} className={styles.icon} />
                                                <p>Tiết Kiệm: {tienTietKiem.toLocaleString()} VNĐ</p>
                                            </div>
                                        </div>

                                        <div className={styles.actionButtons}>
                                            <button
                                                className={styles.orderDetailsButton}
                                                onClick={() => toggleDetails(order.ID_HOADON)}
                                            >
                                                {isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
                                            </button>
                                            <button
                                                className={styles.contactButton}
                                                onClick={() => (window.location.href = `${baseUrl}/contact`)}
                                            >
                                                <FontAwesomeIcon icon={faPhone} /> Liên Hệ
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className={styles.orderDetails}>
                                            <h4>Chi Tiết Sản Phẩm</h4>
                                            {order.chi_tiet && order.chi_tiet.length > 0 ? (
                                                order.chi_tiet.map((product) => (
                                                    <div key={product.ID_TRANGSUC} className={styles.productDetail}>
                                                        <img
                                                            src={product.IMAGEURL ? `${baseUrl}${product.IMAGEURL}` : defaultImage}
                                                            alt={product.TENTS || 'Sản phẩm'}
                                                            className={styles.productImage}
                                                        />
                                                        <div className={styles.productInfo}>
                                                            <p>{`Tên Sản Phẩm: ${product.TENTS}`}</p>
                                                            <p>{`Số Lượng: ${product.SOLUONG}`}</p>
                                                            <p>{`Giá: ${product.GIASP.toLocaleString()} VNĐ`}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>Không có chi tiết.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    duration={2000}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default HistoryPage;
