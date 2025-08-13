import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";

interface AlertArea {
  areaDesc: string;
  polygon: [number, number][];
  description: string;
  event: string;
  urgency: string;
  severity: string;
  instruction?: string;
  web?: string;
}

// --- Helpers ---

function parsePolygon(polygonString: string): [number, number][] {
  return polygonString
    .trim()
    .split(" ")
    .map((pair) => {
      const [latStr, lngStr] = pair.split(",");
      return [parseFloat(latStr), parseFloat(lngStr)] as [number, number];
    });
}

function isHugePolygon(polygon: [number, number][]): boolean {
  const lats = polygon.map((c) => c[0]);
  const lons = polygon.map((c) => c[1]);
  const latRange = Math.max(...lats) - Math.min(...lats);
  const lonRange = Math.max(...lons) - Math.min(...lons);
  return latRange > 10 || lonRange > 20; // PAR/huge polygon threshold
}

// Auto-zoom, ignoring huge polygons
function MapBounds({ polygons }: { polygons: AlertArea[] }) {
  const map = useMap();

  useEffect(() => {
    const visiblePolygons = polygons.filter((p) => !isHugePolygon(p.polygon));
    if (!visiblePolygons.length) return;

    const allCoords = visiblePolygons.flatMap((p) => p.polygon);
    const lats = allCoords.map((c) => c[0]);
    const lons = allCoords.map((c) => c[1]);
    const southWest: [number, number] = [Math.min(...lats), Math.min(...lons)];
    const northEast: [number, number] = [Math.max(...lats), Math.max(...lons)];

    map.fitBounds([southWest, northEast]);
  }, [polygons, map]);

  return null;
}

// --- Main Component ---

export default function PagasaCapMap() {
  const [alertAreas, setAlertAreas] = useState<AlertArea[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const feedUrl = "https://publicalert.pagasa.dost.gov.ph/feeds/";
        const feedText = await fetch(
          `https://corsproxy.io/?url=${encodeURIComponent(feedUrl)}`
        ).then((r) => r.text());

        const feedXml = new DOMParser().parseFromString(feedText, "application/xml");
        const capLinks = Array.from(feedXml.querySelectorAll("link"))
          .map((l) => l.getAttribute("href") || "")
          .filter((href) => href.endsWith(".cap"));

        const areas: AlertArea[] = [];

        for (const capUrl of capLinks) {
          try {
            const capText = await fetch(
              `https://corsproxy.io/?url=${encodeURIComponent(capUrl)}`
            ).then((r) => r.text());

            const capXml = new DOMParser().parseFromString(capText, "application/xml");

            const event = capXml.querySelector("event")?.textContent || "Alert";
            const info = capXml.querySelector("info");
            const description = info?.querySelector("description")?.textContent || "";
            const instruction = info?.querySelector("instruction")?.textContent || "";
            const urgency = info?.querySelector("urgency")?.textContent || "";
            const severity = info?.querySelector("severity")?.textContent || "";
            const web = info?.querySelector("web")?.textContent || "";

            const areaNodes = info?.querySelectorAll("area") || [];
            areaNodes.forEach((areaNode) => {
              const areaDesc = areaNode.querySelector("areaDesc")?.textContent || "Unknown";
              const polygonText = areaNode.querySelector("polygon")?.textContent;
              if (!polygonText) return;

              areas.push({
                areaDesc,
                polygon: parsePolygon(polygonText),
                description,
                event,
                urgency,
                severity,
                instruction,
                web,
              });
            });
          } catch (err) {
            console.error("Error fetching CAP file:", err);
          }
        }

        setAlertAreas(areas);
      } catch (err) {
        console.error("Error fetching feed:", err);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <MapContainer
      center={[12.8797, 121.7740]}
      zoom={6}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {alertAreas
        .filter((area) => !isHugePolygon(area.polygon)) // remove PAR/huge polygon
        .map((area, i) => (
          <Polygon
            key={i}
            positions={area.polygon}
            pathOptions={{ color: "red", fillOpacity: 0.3 }}
          >
            <Popup>
              <div style={{ maxWidth: 320 }}>
                <h3>{area.event}</h3>
                <p><strong>Area:</strong> {area.areaDesc}</p>
                <p>
                  <strong>Severity:</strong> {area.severity} | <strong>Urgency:</strong>{" "}
                  {area.urgency}
                </p>
                <p>
                  {area.description.split(". ").map((sentence, idx) => (
                    <React.Fragment key={idx}>
                      {sentence.trim()}.
                      <br />
                    </React.Fragment>
                  ))}
                </p>
                <p><strong>Instruction:</strong> {area.instruction}</p>
                {area.web && (
                  <p>
                    <strong>More info:</strong>{" "}
                    <a href={area.web} target="_blank" rel="noreferrer">
                      PAGASA Info
                    </a>
                  </p>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}

      <MapBounds polygons={alertAreas} />
    </MapContainer>
  );
}
