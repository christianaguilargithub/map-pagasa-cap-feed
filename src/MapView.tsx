import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue in Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Position {
  lat: number;
  lng: number;
}

// Component to move map when position updates
function SetViewOnLocation({ position }: { position: Position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 15);
    }
  }, [map, position]);
  return null;
}

export default function MapView() {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          // fallback to Manila
          setPosition({ lat: 14.5995, lng: 120.9842 });
        }
      );
    } else {
      console.error("Geolocation not supported");
      setPosition({ lat: 14.5995, lng: 120.9842 }); // fallback
    }
  }, []);

  return (
    <MapContainer
      center={position || [14.5995, 120.9842]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && (
        <>
          <Marker position={[position.lat, position.lng]}>
            <Popup>You are here</Popup>
          </Marker>
          <SetViewOnLocation position={position} />
        </>
      )}
    </MapContainer>
  );
}












// import * as React from "react";
// import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";

// type AlertArea = {
//   areaDesc: string;
//   polygonString: string;
//   polygon: [number, number][];
//   description: string;
//   event: string;
//   urgency: string;
//   severity: string;
//   instruction?: string; 
//   web?: string;         
// };


// // Example data from your alert XML (trimmed for clarity)
// const alertAreasRaw = [
//   {
//     areaDesc: "Zamboanga Del Norte",
//     polygonString:
//       "8.1070956993496,122.61842671089 8.1063256450131,122.6190424975 8.1459202075159,122.91227755818 8.5201694073058,123.0623430312 8.5330401903455,123.18341974183 8.5137930156821,123.2708419987 8.6615189407194,123.42390286735 8.6226055418762,123.55029294204 8.2275966630773,123.55517510849 8.2271466903726,123.16736434347 8.0023236620904,123.10638609713 7.9145223339059,122.91806578994 7.9418247871616,122.73145050561 7.8879718829355,122.57309783888 7.7300531488787,122.38137024193 7.4849775087207,122.26311223385 7.1367455820388,122.10444037492 7.1485171137826,121.9098263393 7.2751180016429,122.01410785246 7.6403897990265,122.13427571731 7.7942572273343,122.12289527159 7.9829257217169,122.25089616754 8.1070956993496,122.61842671089",
//     description:
//       `Under present weather conditions, At 3:00 AM today, the center of Typhoon "GORIO" {PODUL} was estimated based on all available data at 755 km East of Itbayat, Batanes (20.7°N, 129.1°E) with maximum sustained winds of 120 km/h near the center and gustiness of up to 150 km/h. It is moving West at 25 km/h. Southwest Monsoon affecting the western sections of Southern Luzon, Visayas, and Mindanao. The 12-hour rainfall forecast is light to occasional moderate rains and thunderstorms. WATERCOURSES LIKELY TO BE AFFECTED : + **Zamboanga Del Norte** - Rivers and its tributaries particularly Daro-Dapitan, Dipolog, Dicayas, Golio Duwait, Sindangan, Ingin (Maras), Palandoc, Mucas, Patawag, Quipit, Siocon, Piacan, Anungan, Pangamiran and Sibuco.`,
//     event: "General Flood Advisory (Moderate)",
//     urgency: "Future",
//     severity: "Moderate",
//     instruction:
//       `People living near the mountain slopes and in the low lying areas of the above mentioned river systems and the Local Disaster Risk Reduction and Management Councils concerned advised to take necessary precautionary measures.`,
//     web: "http://www.pagasa.dost.gov.ph/index.php/26-hydromet/1582-flood-forecast-terms-and-symbols",
//   },
//   // You can add other areas here...
// ];

// // Helper to parse polygon string into LatLng tuples
// function parsePolygon(polygonString: string): [number, number][] {
//   return polygonString
//     .trim()
//     .split(" ")
//     .map((pair) => {
//       const [latStr, lngStr] = pair.split(",");
//       return [parseFloat(latStr), parseFloat(lngStr)] as [number, number];
//     });
// }

// export default function AlertMap() {
//   // Prepare alert areas with parsed polygons
//   const alertAreas: AlertArea[] = alertAreasRaw.map((area) => ({
//     ...area,
//     polygon: parsePolygon(area.polygonString),
//   }));

//   return (
//     <MapContainer center={[8.1, 122.6]} zoom={8} style={{ height: "100vh" }}>
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//       {alertAreas.map((area, i) => (
//         <Polygon
//           key={i}
//           positions={area.polygon}
//           pathOptions={{ color: "red", fillOpacity: 0.3 }}
//         >
//         <Popup>
//         <div style={{ maxWidth: 320 }}>
//             <h3>{area.event}</h3>
//             <p><strong>Area:</strong> {area.areaDesc}</p>
//             <p>
//             <strong>Severity:</strong> {area.severity} | <strong>Urgency:</strong> {area.urgency}
//             </p>
//             <p>
//             {area.description.split('. ').map((sentence, idx) => (
//                 <React.Fragment key={idx}>
//                 {sentence.trim()}.
//                 <br />
//                 </React.Fragment>
//             ))}
//             </p>
//             <p><strong>Instruction:</strong> {area.instruction}</p>
//             <p>
//             <strong>More info:</strong>{" "}
//             <a href={area.web} target="_blank" rel="noreferrer">
//                 PAGASA Flood Info
//             </a>
//             </p>
//         </div>
//         </Popup>
//         </Polygon>
//       ))}
//     </MapContainer>
//   );
// }

