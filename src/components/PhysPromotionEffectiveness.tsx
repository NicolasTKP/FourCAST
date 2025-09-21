import { useEffect, useState } from "react";
import BoxPlot from "./BoxPlot";

interface BoxPlotDataItem {
  label: string;
  values: number[];
}

interface PhysicalPurchaseRecord {
  PurchaseID: string;
  CustomerID: string;
  DateTime: string;
  ProductID: string[];
  Quantity: number[];
  Total: number;
  Promotion: boolean[];
}

interface PromotionData {
  [category: string]: number[];
}

const PhysPromotionEffectiveness = () => {
  const [data, setData] = useState<PromotionData>({});

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(
          "/s3/physicalstore/purchase/purchases_physical.json"
        );
        
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} for purchases_physical.json`
          );
        }
        
        const purchases: PhysicalPurchaseRecord[] = await response.json();

        const result: PromotionData = {
          "With Promotion": [],
          "Without Promotion": []
        };

        console.log("Total purchases loaded:", purchases.length);
        console.log("Sample purchase record:", purchases[0]);

        // Process each purchase record
        for (const purchase of purchases) {
          // Debug first few purchases
          if (result["With Promotion"].length + result["Without Promotion"].length < 10) {
            console.log("Processing purchase:", {
              PurchaseID: purchase.PurchaseID,
              ProductID: purchase.ProductID,
              Quantity: purchase.Quantity,
              Promotion: purchase.Promotion
            });
          }

          // Iterate through each product in the purchase
          for (let i = 0; i < purchase.ProductID.length; i++) {
            const quantity = purchase.Quantity[i];
            const hasPromotion = purchase.Promotion[i];

            // Debug individual items
            if (result["With Promotion"].length + result["Without Promotion"].length < 20) {
              console.log(`Item ${i}:`, { quantity, hasPromotion, valid: typeof quantity === 'number' && !isNaN(quantity) && quantity > 0 });
            }

            // Validate quantity is a valid number
            if (typeof quantity === 'number' && !isNaN(quantity) && quantity > 0) {
              if (hasPromotion) {
                result["With Promotion"].push(quantity);
              } else {
                result["Without Promotion"].push(quantity);
              }
            }
          }
        }

        // Calculate detailed statistics
        const withPromotionSum = result["With Promotion"].reduce((a, b) => a + b, 0);
        const withoutPromotionSum = result["Without Promotion"].reduce((a, b) => a + b, 0);
        const withPromotionAvg = result["With Promotion"].length > 0 ? withPromotionSum / result["With Promotion"].length : 0;
        const withoutPromotionAvg = result["Without Promotion"].length > 0 ? withoutPromotionSum / result["Without Promotion"].length : 0;

        console.log("Detailed Promotion Analysis:", {
          "With Promotion": {
            count: result["With Promotion"].length,
            sum: withPromotionSum,
            average: withPromotionAvg,
            sample: result["With Promotion"].slice(0, 10)
          },
          "Without Promotion": {
            count: result["Without Promotion"].length,
            sum: withoutPromotionSum,
            average: withoutPromotionAvg,
            sample: result["Without Promotion"].slice(0, 10)
          }
        });

        setData(result);
      } catch (error) {
        console.error("Error loading physical store promotion data:", error);
        setData({});
      }
    }

    loadData();
  }, []);

  // Transform data for BoxPlot - only include categories that have data
  const promotionData: BoxPlotDataItem[] = Object.entries(data)
    .filter(([category, values]) => values.length > 0)
    .map(([category, values]) => ({
      label: category,
      values: values,
    }))
    .sort((a, b) => {
      // Sort to show "With Promotion" first, then "Without Promotion"
      const order = ["With Promotion", "Without Promotion"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });

  // Calculate summary statistics for display
  const getSummaryStats = (values: number[]) => {
    if (values.length === 0) return { count: 0, avg: 0, median: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      count: values.length,
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100
    };
  };

  const withPromotionStats = data["With Promotion"] ? getSummaryStats(data["With Promotion"]) : { count: 0, avg: 0, median: 0 };
  const withoutPromotionStats = data["Without Promotion"] ? getSummaryStats(data["Without Promotion"]) : { count: 0, avg: 0, median: 0 };

  return (
    <div>
      {promotionData.length > 0 ? (
        <div>
          <BoxPlot 
            data={promotionData} 
            title="Physical Store: Sales Quantity Distribution by Promotion Status"
            width={1350}
            height={500}
          />
          
          {/* Summary Statistics */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '15px', color: '#333' }}>Summary Statistics</h4>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '200px' }}>
                <h5 style={{ color: '#28a745', marginBottom: '10px' }}>With Promotion</h5>
                <p><strong>Total Items:</strong> {withPromotionStats.count.toLocaleString()}</p>
                <p><strong>Average Quantity:</strong> {withPromotionStats.avg}</p>
                <p><strong>Median Quantity:</strong> {withPromotionStats.median}</p>
              </div>
              <div style={{ minWidth: '200px' }}>
                <h5 style={{ color: '#dc3545', marginBottom: '10px' }}>Without Promotion</h5>
                <p><strong>Total Items:</strong> {withoutPromotionStats.count.toLocaleString()}</p>
                <p><strong>Average Quantity:</strong> {withoutPromotionStats.avg}</p>
                <p><strong>Median Quantity:</strong> {withoutPromotionStats.median}</p>
              </div>
              {withPromotionStats.count > 0 && withoutPromotionStats.count > 0 && (
                <div style={{ minWidth: '200px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '10px' }}>Comparison</h5>
                  <p><strong>Promotion Lift (Avg):</strong> {
                    withoutPromotionStats.avg > 0 
                      ? `${Math.round(((withPromotionStats.avg - withoutPromotionStats.avg) / withoutPromotionStats.avg) * 10000) / 100}%`
                      : withPromotionStats.avg > 0 ? `+∞ (baseline is 0)` : 'N/A'
                  }</p>
                  <p><strong>Promotion Lift (Median):</strong> {
                    withoutPromotionStats.median > 0 
                      ? `${Math.round(((withPromotionStats.median - withoutPromotionStats.median) / withoutPromotionStats.median) * 10000) / 100}%`
                      : withPromotionStats.median > 0 ? `+∞ (baseline is 0)` : 'N/A'
                  }</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading physical store promotion data...</p>
      )}
    </div>
  );
};

export default PhysPromotionEffectiveness;