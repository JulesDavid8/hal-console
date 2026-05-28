import { Card } from '../design-system/primitives/Card';
import { Badge } from '../design-system/primitives/Badge';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: 'US' | 'World' | 'Markets';
}

const sampleNews: NewsItem[] = [
  { title: "Fed signals potential rate cuts amid cooling inflation data", source: "Reuters", time: "2h ago", category: "US" },
  { title: "China manufacturing activity contracts for third straight month", source: "Bloomberg", time: "4h ago", category: "World" },
  { title: "Tech stocks rally on strong AI earnings; Nasdaq hits record", source: "WSJ", time: "6h ago", category: "Markets" },
  { title: "Oil prices rise as Middle East tensions escalate", source: "CNBC", time: "8h ago", category: "World" },
];

export function MarketNews() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Market Pulse & News</h3>
        <Badge variant="neutral" size="sm">Live</Badge>
      </div>

      <div className="space-y-4">
        {sampleNews.map((item, index) => (
          <div key={index} className="border-l-2 border-hal-accent/45 pl-3">
            <div className="text-sm leading-snug">{item.title}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-hal-muted">
              <span>{item.source}</span>
              <span>•</span>
              <span>{item.time}</span>
              <Badge size="sm" variant={item.category === 'US' ? 'success' : 'neutral'}>
                {item.category}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-hal-muted mt-4">
        News integration coming soon. Currently showing sample data.
      </p>
    </Card>
  );
}
