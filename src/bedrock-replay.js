//process.env.DEBUG = 'minecraft-protocol' // packet logging

const fs = require('fs');
const bedrock = require('bedrock-protocol');
const colors = require('colors/safe');
const { exit } = require('process');
const Long = require('long');

const getPacketData = (packetName) => {
  return require(`./data/${packetName}.json`);
}

// Create server
const server = bedrock.createServer({
  host: '0.0.0.0',       // optional. host to bind as.
  port: 19132,           // optional
//  version: '1.19.40',   // optional. The server version, latest if not specified. 
})

console.log("Loading files...")

var serverData = {
  respawnPacket: getPacketData('respawn'),
  startGame: getPacketData('start_game'),
  entities: {},
  paintings: {},
  chunks: [],
  subchunks: {},
  players: {}
}

// Load all entities into single JS object
const entityList = fs.readdirSync("./entities/")
for (entityFilename of entityList) {
  entityData = JSON.parse(fs.readFileSync(`./entities/` + entityFilename), (key, value) => {
    if (key == "_value") {
      return null
    } else {
      return value
    }
  })

  serverData.entities[entityData.runtime_id] = entityData
}

// Load all paintings into single JS object
const paintingList = fs.readdirSync("./paintings/")
for (paintingFilename of paintingList) {
  paintingData = JSON.parse(fs.readFileSync(`./paintings/` + paintingFilename))

  serverData.paintings[paintingData.runtime_entity_id] = paintingData
}

// Load chunk data
serverData.chunks = JSON.parse(fs.readFileSync("./chunkdata/chunks.json"))

// Load subchunk data
const subchunkList = fs.readdirSync("./chunkdata/")
for (subchunk of subchunkList) {
  if (subchunk.includes("subchunk_")) {
    serverData.subchunks[ subchunk.substring(9, subchunk.length-5) ] = JSON.parse(fs.readFileSync("./chunkdata/" + subchunk))
  }
}

// Load (execute) plugins
console.log("Loading plugins...")
const pluginList = fs.readdirSync("./plugins/")
for (pluginFile of pluginList) {
  if (pluginFile.includes(".js")) { // Should be a js file
    // Execute the plugin (and also give it required data)
    require("./plugins/" + pluginFile)(server, serverData)
  }
}

console.log(colors.green("Server ready."));



server.on('connect', client => {
  client.on('join', () => {
    // Debug client packets
    //client.on('packet', (packet) => {
    //  console.log('Got client packet', packet)
    //})

    // Log client connection
    console.log('New connection', client.connection.address)
    serverData.players[client.profile.uuid] = {}

    // Send resource pack data (on join)
    //client.queue("resource_packs_info", {"must_accept":true,"has_scripts":false,"force_server_packs":false,"behaviour_packs":[],"texture_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","size":[0,8544714],"content_key":"","sub_pack_name":"","content_identity":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","has_scripts":false,"rtx_enabled":false}]})
    client.queue("resource_packs_info", getPacketData('resource_packs_info'))

    // Resource pack response
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'have_all_packs') {
        //client.write('network_settings', { compression_threshold: 1 })
        // Force client to use the cached mob vote resource pack
        //client.queue("resource_pack_stack", {"must_accept":true,"behavior_packs":[],"resource_packs":[{"uuid":"3bdebb27-13ad-6aa7-b726-e703c4b3fe28","version":"1.0.47","name":""}],"game_version":"*","experiments":[{"name":"spectator_mode","enabled":true},{"name":"data_driven_items","enabled":true}],"experiments_previously_used":true})
        client.queue("resource_pack_stack", getPacketData('resource_pack_stack'))
      } else if (data.response_status === 'completed') {
        // Client ready
        console.log("client ready");



        // Send the "initialization packets"
        //client.queue('player_list', getPacketData('player_list'))
        serverData.players[client.profile.uuid].start_game = serverData.startGame
        serverData.players[client.profile.uuid].runtime_entity_id = "1"
        serverData.players[client.profile.uuid].entity_id = "-236223166499"
        serverData.players[client.profile.uuid].start_game.runtime_entity_id = serverData.players[client.profile.uuid].runtime_entity_id
        serverData.players[client.profile.uuid].start_game.entity_id = serverData.players[client.profile.uuid].entity_id

        client.queue('start_game', serverData.players[client.profile.uuid].start_game)

        client.queue('item_component', { entries: [] })
        client.queue('set_spawn_position', getPacketData('set_spawn_position'))
        client.queue('set_time', getPacketData('set_time'))
        client.queue('set_difficulty', { difficulty: 1 })
        client.queue('set_commands_enabled', { enabled: true })
        client.queue('set_time', getPacketData('set_time'))
        client.queue('update_adventure_settings', getPacketData('update_adventure_settings'))
        client.queue('update_abilities', getPacketData('update_abilities'))
        client.queue('game_rules_changed', getPacketData('game_rules_changed'))
        //client.queue('player_list', getPacketData('player_list'))
        client.queue('biome_definition_list', getPacketData('biome_definition_list'))
        client.queue('player_fog', getPacketData('player_fog'))
        client.queue('available_entity_identifiers', getPacketData('available_entity_identifiers'))
        client.queue('update_attributes', getPacketData('update_attributes'))
        client.queue('creative_content', getPacketData('creative_content'))

        client.queue('inventory_content', {"window_id":"armor","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"inventory","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})
        client.queue('inventory_content', {"window_id":"ui","input":[{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0},{"network_id":0}]})

        //client.queue('inventory_content', getPacketData('inventory_content'))
        //client.queue('crafting_data', getPacketData('crafting_data'))

        client.queue('player_hotbar', {"selected_slot":0,"window_id":"inventory","select_slot":true})

        //client.queue('available_commands', getPacketData('available_commands'))

        //client.queue('set_entity_data', getPacketData('set_entity_data'))
        client.queue('entity_event', {"runtime_entity_id":"1","event_id":"player_check_treasure_hunter_achievement","data":0})
        client.queue('set_entity_data', {"runtime_entity_id":"1","metadata":[{"key":"flags","type":"long","value":{"onfire":false,"sneaking":false,"riding":false,"sprinting":false,"action":false,"invisible":false,"tempted":false,"inlove":false,"saddled":false,"powered":false,"ignited":false,"baby":false,"converting":false,"critical":false,"can_show_nametag":false,"always_show_nametag":false,"no_ai":false,"silent":false,"wallclimbing":false,"can_climb":true,"swimmer":false,"can_fly":false,"walker":false,"resting":false,"sitting":false,"angry":false,"interested":false,"charged":false,"tamed":false,"orphaned":false,"leashed":false,"sheared":false,"gliding":false,"elder":false,"moving":false,"breathing":true,"chested":false,"stackable":false,"showbase":false,"rearing":false,"vibrating":false,"idling":false,"evoker_spell":false,"charge_attack":false,"wasd_controlled":false,"can_power_jump":false,"linger":false,"has_collision":true,"affected_by_gravity":true,"fire_immune":false,"dancing":false,"enchanted":false,"show_trident_rope":false,"container_private":false,"transforming":false,"spin_attack":false,"swimming":false,"bribed":false,"pregnant":false,"laying_egg":false,"rider_can_pick":false,"transition_sitting":false,"eating":false,"laying_down":false}}],"tick":"0","properties":{"ints":[],"floats":[]},"links":[]})
        client.queue('set_health', getPacketData('set_health'))

        client.queue('chunk_radius_update', { chunk_radius: 32 })
        client.queue('respawn', getPacketData('respawn'))



        // Send chunk publisher update
        client.queue('network_chunk_publisher_update', { coordinates: { x: serverData.respawnPacket.position.x, y: 47, z: serverData.respawnPacket.position.z }, radius: 160,"saved_chunks":[] })

        // Send all the chunks in the chunk file
        const chunkData = JSON.parse(fs.readFileSync(`./chunkdata/chunks.json`))
        for (const chunkPacket of chunkData) {
          client.queue("level_chunk", chunkPacket)
        }

        // Send all paintings
        // Send all the entities
        for (const painting in serverData.paintings) {
          client.queue("add_painting", serverData.paintings[painting])
        }

        // Send all the entities
        for (const entity in serverData.entities) {
          client.queue("add_entity", serverData.entities[entity])
        }


        // Constantly send this packet to the client to tell it the center position for chunks. The client should then request these
        // missing chunks from the us if it's missing any within the radius. `radius` is in blocks.
        // TODO: Make better
        loop = setInterval(() => {
          if (serverData.players[client.profile.uuid].position) {
            client.write('network_chunk_publisher_update', { coordinates: { x: serverData.players[client.profile.uuid].position.coordinates.x, y: serverData.players[client.profile.uuid].position.coordinates.y, z: serverData.players[client.profile.uuid].position.coordinates.z }, radius: 160,"saved_chunks":[] })
          }
        }, 4500)

        // Wait some time to allow for the client to recieve and load all the chunks
        setTimeout(() => {
          // Allow the client to spawn
          client.write('play_status', { status: 'player_spawn' })
        }, 6000)
      }
    })

    client.on("move_player", (data) => {
      serverData.players[client.profile.uuid].position = {
        coordinates: data.position,
        pitch: data.pitch,
        yaw: data.yaw,
        head_yaw: data.head_yaw,
        on_ground: data.on_ground,
        ridden_runtime_id: data.ridden_runtime_id
      }
    })

    // Handle client subchunk requests
    client.on("subchunk_request", (data) => {
      const subchunkKey = String(data.origin.x) + "_" + String(data.origin.y) + "_" + String(data.origin.z)

      if (Object.keys(serverData.subchunks).includes(subchunkKey)) {
        // Generate subchunk file path and parse its JSON
        const subchunkData = serverData.subchunks[subchunkKey] //JSON.parse(fs.readFileSync("./chunkdata/subchunk_" + String(data.origin.x) + "_" + String(data.origin.y) + "_" + String(data.origin.z) + ".json"))

        // Create skeleton response
        let subchunkPacketData = {
          cache_enabled: subchunkData.cache_enabled,
          dimension: subchunkData.dimension,
          origin: subchunkData.origin,
          entries: []
        }

        // For every requested "subsubchunk", add it to the response if it exists
        for (const request of data.requests) {
          const subSubchunkKey = String(request.dx) + "_" + String(request.dy) + "_" + String(request.dz)

          if (Object.keys(subchunkData.entries).includes(subSubchunkKey)) {
            subchunkPacketData.entries.push(subchunkData.entries[subSubchunkKey])
          } else {
            console.warn(colors.yellow("WARN: Client requested subsubchunk", subSubchunkKey, "but it was not found, falling back to sending all existing subsubchunks!"))

            subchunkPacketData.entries = []

            for (const subchunkEntry in subchunkData.entries) {
              subchunkPacketData.entries.push(subchunkData.entries[subchunkEntry])
            }

            break;
          }
        }

        // Send the response
        client.write("subchunk", subchunkPacketData)
      } else {
        console.warn(colors.yellow("WARN: Client requested subchunk", subchunkKey, "but it was not found, ignoring request"))
      }
    })

    // Commands
    client.on('command_request', (data) => {
      commandData = data.command.split(' ')

      try {
        switch (commandData[0]) {
          case "/stop": // Stops the server
            client.disconnect("The Server Has Stopped")
            client.close()
            exit()
          case "/rawpacket": // Sends the client the specified packet with data
            client.queue(commandData[1], JSON.parse(commandData.slice(2, commandData.length).join(' ')))
            break
        }
      } catch (e) {
        console.error(e)
      }
    })

    client.on('inventory_transaction', (data) => {
      if (data.transaction.transaction_type == "item_use_on_entity") {
        // Get entity data
        entityData = serverData.entities[data.transaction.transaction_data.entity_runtime_id]

        // Go through entity attributes to determine type
        for (entityAttribute of entityData.metadata) {
          switch (entityAttribute.key) {
            case "npc_skin_id": // Entity is an NPC
              const actorID = Long.fromString(entityData.unique_id)
              const actorIDList = [actorID.getHighBitsUnsigned(), actorID.getLowBitsUnsigned()]

              client.queue("npc_dialogue", {"entity_id":actorIDList,"action_type":"open","dialogue":"","screen_name":"","npc_name":"","action_json":""})
              break
            default:
              // If it doesn't match the switch, then "continue" the loop
              continue
          }

          // Exit for loop once switch has executed
          break
        }
      }
    })

    // Respond to tick synchronization packets
    client.on('tick_sync', (packet) => {
      client.queue('tick_sync', {
        request_time: packet.request_time,
        response_time: BigInt(Date.now())
      })
    })
  })
})