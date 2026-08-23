import { Injectable } from '@nestjs/common';
import { DataService } from '../../services/data.service';

@Injectable()
export class CollectionService {
  constructor(private dataService: DataService) {}

  findAll(name: string) {
    return this.dataService.getCollectionItems(name);
  }

  create(name: string, data: any) {
    return this.dataService.addCollectionItem(name, data);
  }

  update(name: string, id: string, data: any) {
    const item = this.dataService.updateCollectionItem(name, id, data);
    if (!item) return { message: '未找到记录' };
    return item;
  }

  remove(name: string, id: string) {
    const ok = this.dataService.deleteCollectionItem(name, id);
    if (!ok) return { message: '未找到记录' };
    return { message: '删除成功' };
  }
}