import { FilterQuery, Model, UpdateQuery } from 'mongoose';

export class BaseService<T> {
  constructor(private model: Model<T>) {}
  public async get(filter: FilterQuery<T>): Promise<T> {
    let doc = await this.model.findOne(filter);
    if (!doc) {
      doc = await this.model.create(filter);
    }
    return doc;
  }
  public find(data: FilterQuery<T>) {
    return this.model.find(data).lean();
  }
  async findAll(): Promise<T[]> {
    return this.model.find();
  }
  async findOne(data?: FilterQuery<T>): Promise<T> {
    return this.model.findOne(data).lean();
  }
  async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>) {
    return this.model.updateOne(filter, data);
  }
  async updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>) {
    return this.model.updateMany(filter, data);
  }
  async count(data: FilterQuery<T>): Promise<number> {
    return await this.model.find(data).countDocuments().lean();
  }
  async has(data: FilterQuery<T>): Promise<boolean> {
    const guild = await this.model.findOne(data).lean().countDocuments();
    return guild > 0;
  }
  async deleteOne(filter?: FilterQuery<T>) {
    return this.model.deleteOne(filter);
  }
  async deleteMany(filter: FilterQuery<T>) {
    return this.model.deleteMany(filter);
  }
}
