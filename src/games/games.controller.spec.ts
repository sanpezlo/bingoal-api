import { Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GamesController } from '@root/games/games.controller';
import { GamesService } from '@root/games/games.service';
import {
  CreateBallGameDto,
  FindGamesDto,
  FindOneGameDto,
} from '@root/games/dto/games.dto';

describe('GamesController', () => {
  let gamesController: GamesController;
  let spyService: GamesService;

  beforeAll(async () => {
    const ApiServiceProvider: Provider = {
      provide: GamesService,
      useFactory: () => ({
        create: jest.fn(() => ({})),
        find: jest.fn(() => ({})),
        findOne: jest.fn(() => ({})),
        createBall: jest.fn(() => ({})),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [GamesService, ApiServiceProvider],
    }).compile();

    gamesController = module.get<GamesController>(GamesController);
    spyService = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(gamesController).toBeDefined();
    expect(spyService).toBeDefined();
  });

  it('should be called create method', () => {
    gamesController.create();
    expect(spyService.create).toHaveBeenCalled();
  });

  it('should be called find method', () => {
    const findGamesDto = new FindGamesDto();
    gamesController.find(findGamesDto);
    expect(spyService.find).toHaveBeenCalledWith(findGamesDto);
  });

  it('should be called findOne method', () => {
    const findOneGameDto = new FindOneGameDto();
    gamesController.findOne(findOneGameDto);
    expect(spyService.findOne).toHaveBeenCalledWith(findOneGameDto);
  });

  it('should be called createBall method', () => {
    const createBallGameDto = new CreateBallGameDto();
    gamesController.createBall(createBallGameDto);
    expect(spyService.createBall).toHaveBeenCalledWith(createBallGameDto);
  });
});
