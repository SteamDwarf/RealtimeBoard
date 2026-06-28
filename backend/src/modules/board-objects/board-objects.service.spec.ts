import { Test, TestingModule } from '@nestjs/testing';
import { BoardObjectsService } from './board-objects.service';

describe('BoardObjectsService', () => {
  let service: BoardObjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoardObjectsService],
    }).compile();

    service = module.get<BoardObjectsService>(BoardObjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
