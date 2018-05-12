const reqQuery = (response, data, sort = 'createdAt', order = 'desc', offset = 0, count = 9) => {
  if (offset) {
    offset = parseInt(offset, 10);
  }
  if (count) {
    count = parseInt(count, 10);
  }
  if (data.length > 0) {
    if (sort) {
      if (order === 'asc') {
        if (typeof (data[0][`${sort}`]) === 'string') {
          data.sort((a, b) => a[`${sort}`] > b[`${sort}`]);
        } else {
          data.sort((a, b) => a[`${sort}`] - b[`${sort}`]);
        }
      } else if (order === 'desc') {
        if (typeof (data[0][`${sort}`]) === 'string') {
          data.sort((a, b) => b[`${sort}`] > a[`${sort}`]);
        } else {
          data.sort((a, b) => b[`${sort}`] - a[`${sort}`]);
        }
      } else {
        response.status(404).json({
          error: {
            message: 'Not Found: Order of sorting does not exist.'
          }
        });
      }
    }
    if (!Number.isNaN(count) && !Number.isNaN(offset)) data = data.slice(offset, offset + count);
  }
  return data;
};

export default reqQuery;
