import { CardsRepository } from '@root/cards/cards.repository';
import { Card } from '@root/cards/schemas/card.schema';

export const _cards: Card[] = [
  {
    data: [
      1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 31, 32, 0, 33, 34, 46, 47, 48, 49, 50,
      61, 62, 63, 64, 65,
    ],
  },
];

export async function createCards(
  cardsRepository: CardsRepository,
  card: Card,
) {
  return await cardsRepository.create(card);
}