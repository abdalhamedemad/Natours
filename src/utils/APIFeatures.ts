import { Query } from 'mongoose';

class APIFeature<T> {
  public query: Query<T[], T>;

  public queryString: Record<string, string | undefined>;

  constructor(
    query: Query<T[], T>,
    queryString: Record<string, string | undefined>,
  ) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): this {
    // filtering
    const queryObj: Record<string, unknown> = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // remove object key and use forEach bec we do not needs to return new array
    excludedFields.forEach((el) => delete queryObj[el]);
    // advanced filtering
    // we want to convert gte, gt ... other operator to start with $
    // first change into string the replace the string using Regex
    let queryStr: string = JSON.stringify(queryObj);
    // \b for exact this words separately /g for if one or more match change them
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // each method in mongoose return a query that can chain on it
    // in order we want to execute and no longer chains add await before it
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort(): this {
    // Sorting
    if (this.queryString.sort) {
      // if we want sort by more than on field
      // query.sort('price ratings'); in url was sort=price,ratings
      const sortBy = this.queryString.sort.split(',').join(' ');
      // Asc default
      // Des just in query parameter add - before the field
      this.query = this.query.sort(sortBy);
    } else {
      // default sorting
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limit(): this {
    // Field limiting like ?fields=name,duration... mongo wants 'name duration ..'
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // remove unrequired fields like __V which added by mongo so
      // to exclude a field add - before it ex '-__v)
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination(): this {
    // Pagination
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

export default APIFeature;
