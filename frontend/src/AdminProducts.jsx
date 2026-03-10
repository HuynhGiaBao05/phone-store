import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminProducts.css";

function AdminProducts() {

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    brand: "",
    originalPrice: "",
    discount: "",
    stock: "",
    description: "",
    promotion: "",
    promoEndDate: "",
    image: null
  });

  // ================= FETCH =================

  useEffect(() => {
    fetchProducts(currentPage, selectedCategory);
  }, [currentPage, selectedCategory]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async (page = 1, category = "all") => {
    try {

      const res = await axios.get(
        `http://localhost:5000/api/products?page=${page}&limit=5&category=${category}`
      );

      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);

    } catch (error) {
      console.log(error);
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get("http://localhost:5000/api/categories");
    setCategories(res.data);
  };

  const fetchBrands = async () => {
    const res = await axios.get("http://localhost:5000/api/brands");
    setBrands(res.data);
  };

  // ================= DELETE =================

  const handleDelete = async (id) => {

    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {

      await axios.delete(
        `http://localhost:5000/api/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`
          }
        }
      );

      fetchProducts(currentPage, selectedCategory);

    } catch (error) {

      console.log("Lỗi xóa sản phẩm:", error);

    }

  };

  // ================= SAVE =================

  const handleSave = async () => {

    if (!newProduct.category || !newProduct.brand) {
      alert("Vui lòng chọn category và brand");
      return;
    }

    try {

      const formData = new FormData();

      formData.append("name", newProduct.name);
      formData.append("category", newProduct.category);
      formData.append("brand", newProduct.brand);
      formData.append("originalPrice", newProduct.originalPrice);
      formData.append("discount", newProduct.discount);
      formData.append("stock", newProduct.stock);
      formData.append("description", newProduct.description);
      formData.append("promotion", newProduct.promotion);
      formData.append("promoEndDate", newProduct.promoEndDate);

      if (newProduct.image) {
        formData.append("image", newProduct.image);
      }

      if (editingProduct) {

        await axios.put(
          `http://localhost:5000/api/products/${editingProduct._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
          }
        );

      } else {

        await axios.post(
          "http://localhost:5000/api/products/create",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`
            }
          }
        );

      }

      setShowModal(false);
      setEditingProduct(null);
      fetchProducts(currentPage, selectedCategory);

    } catch (error) {

      console.log("Lỗi lưu sản phẩm:", error);

    }

  };

  return (

    <div className="admin-products">

      <div className="products-header">

        <h2 className="page-title">Quản lý sản phẩm</h2>

        <button
          className="btn-primary"
          onClick={() => {

            setEditingProduct(null);

            setNewProduct({
              name: "",
              category: "",
              brand: "",
              originalPrice: "",
              discount: "",
              stock: "",
              description: "",
              promotion: "",
              promoEndDate: "",
              image: null
            });

            setShowModal(true);

          }}
        >
          + Thêm sản phẩm
        </button>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <table className="product-table">

          <thead>

            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Hành động</th>
            </tr>

          </thead>

          <tbody>

            {products.map((p) => (

              <tr key={p._id}>

                <td>
                  <img src={p.image} alt={p.name} className="product-img" />
                </td>

                <td>{p.name}</td>

                <td>
                  {(p.discount > 0 ? p.price : p.originalPrice)?.toLocaleString()} ₫
                </td>

                <td>{p.stock}</td>

                <td>

                  <button
                    className="btn-edit"
                    onClick={() => {

                      setEditingProduct(p);

                      setNewProduct({
                        name: p.name,
                        category: p.category?._id,
                        brand: p.brand?._id,
                        originalPrice: p.originalPrice,
                        discount: p.discount,
                        stock: p.stock,
                        description: p.description,
                        promotion: p.promotion,
                        promoEndDate: "",
                        image: null
                      });

                      setShowModal(true);

                    }}
                  >
                    Sửa
                  </button>

                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(p._id)}
                  >
                    Xóa
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* MODAL */}

      {showModal && (

        <div className="modal-overlay" onClick={() => setShowModal(false)}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            <h3>{editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}</h3>

            <input
              type="text"
              placeholder="Tên sản phẩm"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />

            {/* CATEGORY */}

            <select
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
            >
              <option value="">Chọn danh mục</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* BRAND */}

            <select
              value={newProduct.brand}
              onChange={(e) =>
                setNewProduct({ ...newProduct, brand: e.target.value })
              }
            >
              <option value="">Chọn thương hiệu</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Giá gốc"
              value={newProduct.originalPrice}
              onChange={(e) =>
                setNewProduct({ ...newProduct, originalPrice: e.target.value })
              }
            />

           <input
  type="number"
  placeholder="Giảm giá (%)"
  value={newProduct.discount}
  onChange={(e) =>
    setNewProduct({
      ...newProduct,
      discount: e.target.value,
      promoEndDate:
        Number(e.target.value) > 0
          ? newProduct.promoEndDate
          : ""
    })
  }
/>

            {Number(newProduct.discount) > 0 && (
  <input
    type="datetime-local"
    value={newProduct.promoEndDate}
    onChange={(e) =>
      setNewProduct({
        ...newProduct,
        promoEndDate: e.target.value
      })
    }
  />
)}

            <input
              type="number"
              placeholder="Tồn kho"
              value={newProduct.stock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
            />

            <textarea
              placeholder="Mô tả"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />

            <textarea
              placeholder="Nội dung khuyến mãi"
              value={newProduct.promotion}
              onChange={(e) =>
                setNewProduct({ ...newProduct, promotion: e.target.value })
              }
            />

            <input
              type="file"
              onChange={(e) =>
                setNewProduct({ ...newProduct, image: e.target.files[0] })
              }
            />

            <div className="modal-actions">

              <button onClick={handleSave} className="btn-primary">
                Lưu
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="btn-delete"
              >
                Hủy
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default AdminProducts;