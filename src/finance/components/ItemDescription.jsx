import { parseItemDescription } from '../utils/itemDescription.js';

export default function ItemDescription({ description }) {
  return <div className="item-description">{parseItemDescription(description || 'Line item').map((block, index) => {
    if (block.type === 'text') return <p key={index}>{block.text}</p>;
    const List = block.type === 'ordered' ? 'ol' : 'ul';
    return <List key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex} value={item.number}>{item.text}</li>)}</List>;
  })}</div>;
}
