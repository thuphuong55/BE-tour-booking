const provinces = require("../data/provinces.json");

exports.searchProvinces = (req, res) => {
  const { keyword = "", region } = req.query;
  const kw = keyword.toLowerCase();

  const filtered = provinces.filter(p => {
    const matchName = p.name.toLowerCase().includes(kw);
    const matchUnsigned = p.name_unsigned.toLowerCase().includes(kw);
    const matchRegion = region ? p.region.toLowerCase() === region.toLowerCase() : true;

    return (matchName || matchUnsigned) && matchRegion;
  });

  res.json(filtered);
};
