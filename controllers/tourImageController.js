const { Op } = require("sequelize");
const { TourImage, Tour } = require("../models");

/* ----------  Helpers  ---------- */
const DEFAULT_LIMIT = 20;                       // tuỳ chỉnh nếu muốn
const getPaging = (page = 1, limit = DEFAULT_LIMIT) => {
  const _page  = Math.max(parseInt(page, 10) || 1, 1);
  const _limit = Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1);
  return { offset: (_page - 1) * _limit, limit: _limit, page: _page };
};
const buildMeta = (count, { page, limit }) => ({
  totalItems: count,
  totalPages: Math.ceil(count / limit) || 1,
  currentPage: page,
});

/* ----------  Lấy ảnh của một tour  ---------- */
const getByTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { page, limit } = req.query;

    const paging = getPaging(page, limit);
    const { rows: images, count } = await TourImage.findAndCountAll({
      where: { tour_id: tourId },
      order: [["is_main", "DESC"], ["created_at", "DESC"]],
      ...paging,
    });

    res.json({ data: images, meta: buildMeta(count, paging) });
  } catch (err) {
    console.error("Lỗi khi lấy ảnh tour:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ----------  Lấy ảnh của nhiều tour  ---------- */
const getAll = async (req, res) => {
  try {
    const { tourIds, page, limit } = req.query; // tourIds = "id1,id2,..."
    const paging = getPaging(page, limit);

    const where = tourIds
      ? { tour_id: { [Op.in]: tourIds.split(",") } }
      : {}; // không lọc → lấy hết

    const { rows: images, count } = await TourImage.findAndCountAll({
      where,
      include: [{ model: Tour, attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
      ...paging,
    });

    res.json({ data: images, meta: buildMeta(count, paging) });
  } catch (err) {
    console.error("Lỗi khi lấy album ảnh:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/* ----------  Tạo ảnh mới ---------- */
const create = async (req, res) => {
  try {
    const { tour_id, image_url, is_main } = req.body;
    const mainFlag = is_main === true || is_main === "true";

    if (mainFlag) {
      await TourImage.update({ is_main: false }, { where: { tour_id } });
    }

    const newImage = await TourImage.create({
      tour_id,
      image_url,
      is_main: mainFlag,
    });

    res.status(201).json(newImage);
  } catch (err) {
    console.error("Lỗi khi tạo ảnh tour:", err);
    res.status(400).json({ message: "Lỗi dữ liệu ảnh", error: err.message });
  }
};

/* ----------  Cập nhật ảnh ---------- */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_main } = req.body;
    const mainFlag = is_main === true || is_main === "true";

    const image = await TourImage.findByPk(id);
    if (!image) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    if (mainFlag) {
      await TourImage.update({ is_main: false }, { where: { tour_id: image.tour_id } });
    }
    await image.update({ is_main: mainFlag });

    res.json(image);
  } catch (err) {
    console.error("Lỗi khi cập nhật ảnh:", err);
    res.status(400).json({ message: "Cập nhật ảnh lỗi", error: err.message });
  }
};

/* ----------  Xoá ảnh ---------- */
const remove = async (req, res) => {
  try {
    const image = await TourImage.findByPk(req.params.id);
    if (!image) return res.status(404).json({ message: "Không tìm thấy ảnh" });

    await image.destroy();
    res.json({ message: "Đã xoá ảnh thành công" });
  } catch (err) {
    console.error("Lỗi khi xoá ảnh:", err);
    res.status(500).json({ message: "Xoá ảnh thất bại" });
  }
};

module.exports = { getAll, getByTour, create, update, delete: remove };
