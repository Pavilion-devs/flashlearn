-- Create the functions for incrementing and decrementing card counts
CREATE OR REPLACE FUNCTION increment_deck_card_count(deck_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE decks
  SET "cardCount" = COALESCE("cardCount", 0) + 1
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_deck_card_count(deck_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE decks
  SET "cardCount" = GREATEST(COALESCE("cardCount", 0) - 1, 0)
  WHERE id = deck_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update card counts
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM decrement_deck_card_count(OLD."deckId");
    RETURN OLD;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM increment_deck_card_count(NEW."deckId");
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flashcard_count_trigger
AFTER INSERT OR DELETE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_deck_card_count();